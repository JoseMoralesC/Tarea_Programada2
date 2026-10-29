import {crearCrudNegocio, campoTexto, campoEstado, campoFecha} from './crud-negocio.js';

export const typeDefs = `#graphql
    type Auditoria { IdAuditoria: Int!, Tabla: String!, Accion: AccionAuditoria!, Usuario: String!, Fecha: FechaHora! }
    input AuditoriaInput { tabla: String!, accion: AccionAuditoria!, usuario: String!, fecha: FechaHora }
    input AuditoriaCambios { tabla: String, accion: AccionAuditoria, usuario: String, fecha: FechaHora }
    extend type Query { auditorias(idAuditoria: Int, tabla: String): [Auditoria!]! }
    extend type Mutation {
        agregarAuditoria(datos: AuditoriaInput!): Int!
        modificarAuditoria(idAuditoria: Int!, datos: AuditoriaCambios!): Boolean!
        borrarAuditoria(idAuditoria: Int!): Boolean!
    }
`;

export const resolvers = crearCrudNegocio({
    nombre: 'Auditoria', consulta: 'auditorias', id: 'IdAuditoria',
    administrativo: true,
    campos: {
        tabla: campoTexto('Tabla', 50), accion: campoEstado('Accion', ['I', 'U', 'D'], 1),
        usuario: campoTexto('Usuario', 100), fecha: campoFecha('Fecha'),
    },
    filtros: {tabla: campoTexto('Tabla', 50)},
});

