-- CORRECCIÓN DE LA TABLA ROLE_SYNONYMS
-- Este archivo corrige los mapeos incorrectos en la tabla role_synonyms
-- basándose en los IDs reales de la tabla roles

-- ==============================================
-- 1. LIMPIAR TABLA EXISTENTE (OPCIONAL)
-- ==============================================
-- Descomenta la siguiente línea si quieres limpiar todos los sinónimos existentes
-- DELETE FROM "public"."role_synonyms";

-- ==============================================
-- 2. INSERTAR SINÓNIMOS CORREGIDOS
-- ==============================================

-- CEO (role_id = 1)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('1', '1', 'CEO'),
('2', '1', 'Chief Executive Officer'),
('3', '1', 'Directora General'),
('4', '1', 'Director General'),
('5', '1', 'Gerente General'),
('6', '1', 'C.E.O.');

-- CMO/Director de Marketing (role_id = 2)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('7', '2', 'CMO'),
('8', '2', 'Marketing'),
('9', '2', 'Comunicación'),
('10', '2', 'Publicidad'),
('11', '2', 'Director de Marketing'),
('12', '2', 'Director Comercial');

-- CTO/Director de Tecnología (role_id = 3)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('13', '3', 'CTO'),
('14', '3', 'CIO'),
('15', '3', 'IT'),
('16', '3', 'Sistemas'),
('17', '3', 'Director de Tecnología'),
('18', '3', 'Director Tecnológico');

-- Gerente de Marketing (role_id = 4)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('19', '4', 'Gerente de Marketing'),
('20', '4', 'Marketing Manager');

-- Gerente de TI (role_id = 5)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('21', '5', 'Gerente de TI'),
('22', '5', 'IT Manager'),
('23', '5', 'Director de Sistemas');

-- Líder/Gerente de Ventas (role_id = 6)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('24', '6', 'Líder de Ventas'),
('25', '6', 'Gerente de Ventas'),
('26', '6', 'Director de Ventas'),
('27', '6', 'CSO'),
('28', '6', 'Director Comercial');

-- Analista/Especialista TI (role_id = 7)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('29', '7', 'Analista TI'),
('30', '7', 'Especialista TI'),
('31', '7', 'Desarrollador'),
('32', '7', 'Programador');

-- Academia/Investigación (role_id = 8)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('33', '8', 'Academia'),
('34', '8', 'Investigación'),
('35', '8', 'Investigador'),
('36', '8', 'Académico');

-- Educación/Docentes (role_id = 9)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('37', '9', 'Educación'),
('38', '9', 'Docentes'),
('39', '9', 'Profesor'),
('40', '9', 'Maestro');

-- Diseño/Industrias Creativas (role_id = 10)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('41', '10', 'Diseño'),
('42', '10', 'Industrias Creativas'),
('43', '10', 'Creativo'),
('44', '10', 'Diseñador');

-- Dirección de Ventas (role_id = 11)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('45', '11', 'Dirección de Ventas'),
('46', '11', 'Director de Ventas');

-- Dirección de Operaciones (role_id = 12)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('47', '12', 'Dirección de Operaciones'),
('48', '12', 'Director de Operaciones'),
('49', '12', 'Operaciones');

-- Dirección de Finanzas (role_id = 13)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('50', '13', 'Dirección de Finanzas'),
('51', '13', 'CFO'),
('52', '13', 'Director Financiero'),
('53', '13', 'Finanzas');

-- Dirección de RRHH (role_id = 14)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('54', '14', 'Dirección de RRHH'),
('55', '14', 'Director de RRHH'),
('56', '14', 'Director de Recursos Humanos'),
('57', '14', 'RRHH');

-- Dirección de Contabilidad (role_id = 15)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('58', '15', 'Dirección de Contabilidad'),
('59', '15', 'Director de Contabilidad'),
('60', '15', 'Contabilidad');

-- Dirección de Compras (role_id = 16)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('61', '16', 'Dirección de Compras'),
('62', '16', 'Director de Compras'),
('63', '16', 'Supply Chain'),
('64', '16', 'Compras');

-- Miembros de Ventas (role_id = 17)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('65', '17', 'Miembros de Ventas'),
('66', '17', 'Vendedor'),
('67', '17', 'Representante de Ventas');

-- Miembros de Marketing (role_id = 18)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('68', '18', 'Miembros de Marketing'),
('69', '18', 'Especialista en Marketing');

-- Miembros de Operaciones (role_id = 19)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('70', '19', 'Miembros de Operaciones'),
('71', '19', 'Operador');

-- Miembros de Finanzas (role_id = 20)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('72', '20', 'Miembros de Finanzas'),
('73', '20', 'Analista Financiero');

-- Miembros de RRHH (role_id = 21)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('74', '21', 'Miembros de RRHH'),
('75', '21', 'Especialista en RRHH');

-- Miembros de Contabilidad (role_id = 22)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('76', '22', 'Miembros de Contabilidad'),
('77', '22', 'Contador');

-- Miembros de Compras (role_id = 23)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('78', '23', 'Miembros de Compras'),
('79', '23', 'Comprador');

-- Gerencia Media (role_id = 24)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('80', '24', 'Gerencia Media'),
('81', '24', 'Gerente');

-- Freelancer (role_id = 25)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('82', '25', 'Freelancer'),
('83', '25', 'Independiente');

-- Consultor (role_id = 26)
INSERT INTO "public"."role_synonyms" ("id", "role_id", "alias") VALUES 
('84', '26', 'Consultor'),
('85', '26', 'Asesor');

-- ==============================================
-- 3. VERIFICACIÓN
-- ==============================================
-- Verificar que los sinónimos se insertaron correctamente
SELECT 
    rs.id,
    rs.role_id,
    r.nombre as role_name,
    rs.alias
FROM "public"."role_synonyms" rs
JOIN "public"."roles" r ON rs.role_id = r.id
ORDER BY rs.role_id, rs.alias;
