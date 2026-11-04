import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildSchema, parse, validate, getVariableValues} from 'graphql';
import * as scalars from '../src/graphql/scalars.js';

const files = ['autenticacion','categoria','marca','rol','usuario','empleado','aseguradora',
    'caso','cotizacion','detalleCotizacion','venta','detalleVenta','envio','auditoria'];
const modules = await Promise.all(files.map(name => import(`../src/modules/${name}.js`)));
const schema = buildSchema([scalars.typeDefs, ...modules.map(x => x.typeDefs)].join('\n'));
schema.getType('Dinero').parseValue = scalars.normalizarDinero;
schema.getType('FechaHora').parseValue = scalars.fechaHora;
const collection = JSON.parse(readFileSync('docs/pruebas/demo_crud_B.postman_collection.json', 'utf8'));
const all = collection.item.flatMap(f => f.item);
let assertions = 0, documents = 0;
function expect(actual) {
    const chain = new Proxy({}, {get(_, key) {
        if (['to','be','have','include'].includes(key)) return chain;
        if (key === 'undefined') {assert.equal(actual, undefined); return chain;}
        if (key === 'eql') return expected => assert.deepEqual(
            JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)));
        if (key === 'above') return min => assert(actual > min);
        if (key === 'lengthOf') return n => assert.equal(actual.length, n);
        if (key === 'members') return values => values.forEach(v => assert(actual.includes(v)));
        throw new Error('Asercion Postman no soportada: ' + String(key));
    }});
    return chain;
}
function environment() {
    return new Map([...collection.variable.map(x => [x.key, x.value]),
        ['correoLogin','admin@example.invalid'], ['claveLogin','Ficticia!'],
        ['idModeloReferencia','1'],['idRepuestoReferencia','2'],['idBodegaReferencia','3']]);
}
const roles = [{IdRol:1,Nombre:'Administrador'},{IdRol:2,Nombre:'Empleado'},{IdRol:3,Nombre:'Cliente'}];
const plural = {usuarios:'Usuario',empleados:'Empleado',aseguradoras:'Aseguradora',casos:'Caso',
    cotizaciones:'Cotizacion',detallesCotizacion:'DetalleCotizacion',ventas:'Venta',
    detallesVenta:'DetalleVenta',envios:'Envio',auditorias:'Auditoria'};
const pk = t => t.startsWith('Detalle') ? 'IdDetalle' : 'Id' + t;
function memory() {return {rows:new Map(Object.values(plural).map(t => [t,new Map()])), next:100, stock:10};}
function response(body, db) {
    const op = parse(body.query).definitions[0];
    const field = op.selectionSet.selections[0].name.value;
    const v = body.variables ?? {};
    if (field === 'login') return {data:{login:{token:'token-simulado',usuario:{idUsuario:1,rol:'ADMINISTRADOR'}}}};
    if (field === 'roles') return {data:{roles}};
    if (field === 'agregarRol') return {errors:[{extensions:{code:'CONFLICT'}}],data:null};
    if (field === 'cerrarSesion') return {data:{cerrarSesion:true}};
    const match = /^(agregar|modificar|borrar)(.+)$/.exec(field);
    if (!match) {
        const row = db.rows.get(plural[field]).get(v.id);
        return {data:{[field]: row ? [structuredClone(row)] : []}};
    }
    const [,action,type] = match;
    const rows = db.rows.get(type);
    let old, row;
    if (action === 'agregar') {
        row = {[pk(type)]:++db.next};
        for (const [k,value] of Object.entries(v.datos)) row[k[0].toUpperCase()+k.slice(1)] = value;
        if (['Cotizacion','Venta'].includes(type)) row.Total='0.00';
        rows.set(row[pk(type)], row);
    } else {
        old = structuredClone(rows.get(v.id));
        assert(old, 'El mock detecto una operacion sobre ID inexistente');
        if (action === 'borrar') rows.delete(v.id);
        else {
            row=rows.get(v.id);
            for(const [k,value] of Object.entries(v.datos)) row[k[0].toUpperCase()+k.slice(1)]=value;
        }
    }
    if (type === 'DetalleVenta') db.stock += (old?.Cantidad ?? 0) - (row?.Cantidad ?? 0);
    if (['DetalleVenta','DetalleCotizacion'].includes(type)) {
        const parent = type === 'DetalleVenta' ? 'Venta' : 'Cotizacion';
        for (const p of db.rows.get(parent).values()) {
            const total=[...rows.values()].filter(x=>x['Id'+parent]===p['Id'+parent])
                .reduce((sum,x)=>sum+x.Cantidad*Number(x.Precio),0);
            p.Total=total.toFixed(2);
        }
    }
    return {data:{[field]: action === 'agregar' ? row[pk(type)] : true}};
}
function run(item, values, db, options={}) {
    let raw=item.request.body.raw, skipped=false, stopped=false, result;
    const testErrors=[];
    const vars={
        get:k=>values.get(k), set:(k,v)=>values.set(k,v), unset:k=>values.delete(k),
        replaceIn:s=>s.replace(/{{(\w+)}}/g,(_,k)=>String(values.get(k) ?? '')),
    };
    const pm={variables:vars,collectionVariables:vars,
        execution:{setNextRequest:x=>{assert.equal(x,null);stopped=true;},skipRequest:()=>{skipped=true;}},
        request:{body:{mode:'raw',get raw(){return raw;},update:s=>{raw=s;}}},
        expect,test:(_name,callback)=>{try {callback();assertions++;} catch(e) {testErrors.push(e);}},
    };
    try {
        for(const e of item.event.filter(x=>x.listen==='prerequest')) vm.runInNewContext(e.script.exec.join('\n'),{pm},{timeout:1000});
        if(skipped) return {skipped,stopped};
        const body=JSON.parse(raw), doc=parse(body.query);
        assert.deepEqual(validate(schema,doc),[],item.name);
        const op=doc.definitions[0];
        const inputs=getVariableValues(schema,op.variableDefinitions??[],body.variables??{});
        assert.equal(inputs.errors,undefined,item.name+': variables invalidas');
        documents++;
        result=options.error ? {errors:[{extensions:{code:'SIMULADO'}}],data:null} : response(body,db);
        pm.response={code:200,json:()=>result};
        for(const e of item.event.filter(x=>x.listen==='test')) vm.runInNewContext(e.script.exec.join('\n'),{pm},{timeout:1000});
        if(testErrors.length) throw testErrors[0];
        return {skipped,stopped,body};
    } catch(error) {if(options.throws) return {error,stopped}; throw new Error(item.name+': '+error.message,{cause:error});}
}

// Recorrido entero: documentos reales, variables encadenadas, cambios y limpieza.
const values=environment(), db=memory();
for(const item of all) run(item,values,db);
assert([...db.rows.values()].every(rows=>rows.size===0));
assert.equal(db.stock,10,'El ciclo de DetalleVenta debe devolver las existencias');
assert.equal(values.has('token'),false);
assert(Object.values(JSON.parse(values.get('demoCreados'))).every(x=>!x.activo));

// Una segunda ejecucion genera datos diferentes y no reutiliza IDs anteriores.
const firstRun=values.get('demoRun');
for(const item of all) run(item,values,db);
assert.notEqual(values.get('demoRun'),firstRun);

// Recuperacion tras un fallo parcial: limpiar tambien funciona con IDs ausentes.
const partial=environment(), partialDB=memory();
for(const f of collection.item.slice(0,3)) for(const it of f.item) run(it,partial,partialDB);
for(const it of collection.item[3].item.slice(0,7)) run(it,partial,partialDB);
assert(run(collection.item[1].item[0],partial,partialDB,{throws:true}).stopped,'No reiniciar con pendientes');
const next=collection.item[3].item[7];
assert(run(next,partial,partialDB,{error:true,throws:true}).stopped,'Parar Runner ante error GraphQL');
for(const it of collection.item[5].item) run(it,partial,partialDB);
assert([...partialDB.rows.values()].every(rows=>rows.size===0));

// No aceptar un ID manual ajeno en un borrado, incluso si la variable sigue correcta.
const owned=environment(), ownedDB=memory();
for(const f of collection.item.slice(0,2)) for(const it of f.item) run(it,owned,ownedDB);
run(collection.item[3].item[0],owned,ownedDB);
const target=collection.item[5].item.find(it=>it.name==='UsuarioEmpleado - Borrar solo registro creado');
const altered=structuredClone(target);
const payload=JSON.parse(altered.request.body.raw);payload.variables.id=1;
altered.request.body.raw=JSON.stringify(payload);
assert(run(altered,owned,ownedDB,{throws:true}).stopped,'No borrar IDs ajenos al registro');

// Ceros de plantilla se detectan antes de las altas.
const invalid=environment();invalid.set('idModeloReferencia','0');
assert(run(collection.item[1].item[0],invalid,memory(),{throws:true}).stopped);
console.log(`OK: ${all.length} solicitudes, ${documents} documentos/variables validados, ${assertions} aserciones simuladas; limpieza completa/parcial, stock simulado, IDs ajenos y fallos comprobados. Sin SQL real.`);
