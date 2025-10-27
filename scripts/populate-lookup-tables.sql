-- Script para poblar las tablas lookup con datos de ejemplo
-- Ejecutar en Supabase SQL Editor

-- Insertar áreas
INSERT INTO areas (id, slug, nombre) VALUES 
(1, 'tecnologia', 'Tecnología'),
(2, 'marketing', 'Marketing'),
(3, 'ventas', 'Ventas'),
(4, 'recursos-humanos', 'Recursos Humanos'),
(5, 'finanzas', 'Finanzas'),
(6, 'operaciones', 'Operaciones'),
(7, 'producto', 'Producto'),
(8, 'diseño', 'Diseño'),
(9, 'liderazgo', 'Liderazgo')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- Insertar niveles
INSERT INTO niveles (id, slug, nombre) VALUES 
(1, 'junior', 'Junior'),
(2, 'mid-level', 'Mid-Level'),
(3, 'senior', 'Senior'),
(4, 'lead', 'Lead'),
(5, 'manager', 'Manager'),
(6, 'director', 'Director'),
(7, 'vp', 'VP'),
(8, 'c-level', 'C-Level')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- Insertar roles
INSERT INTO roles (id, slug, nombre, area_id) VALUES 
(1, 'desarrollador', 'Desarrollador', 1),
(2, 'tech-lead', 'Tech Lead', 1),
(3, 'arquitecto', 'Arquitecto de Software', 1),
(4, 'devops', 'DevOps Engineer', 1),
(5, 'qa', 'QA Engineer', 1),
(6, 'marketing-manager', 'Marketing Manager', 2),
(7, 'content-creator', 'Content Creator', 2),
(8, 'growth-hacker', 'Growth Hacker', 2),
(9, 'sales-rep', 'Sales Representative', 3),
(10, 'sales-manager', 'Sales Manager', 3),
(11, 'account-manager', 'Account Manager', 3),
(12, 'hr-specialist', 'HR Specialist', 4),
(13, 'recruiter', 'Recruiter', 4),
(14, 'financial-analyst', 'Financial Analyst', 5),
(15, 'controller', 'Controller', 5),
(16, 'operations-manager', 'Operations Manager', 6),
(17, 'product-manager', 'Product Manager', 7),
(18, 'product-owner', 'Product Owner', 7),
(19, 'ui-designer', 'UI Designer', 8),
(20, 'ux-designer', 'UX Designer', 8),
(21, 'ceo', 'CEO', 9),
(22, 'cto', 'CTO', 9),
(23, 'cmo', 'CMO', 9),
(24, 'cfo', 'CFO', 9)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- Insertar relaciones
INSERT INTO relaciones (id, slug, nombre) VALUES 
(1, 'empleado', 'Empleado'),
(2, 'freelancer', 'Freelancer'),
(3, 'consultor', 'Consultor'),
(4, 'contratista', 'Contratista'),
(5, 'socio', 'Socio'),
(6, 'inversor', 'Inversor'),
(7, 'advisor', 'Advisor')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- Insertar tamaños de empresa
INSERT INTO tamanos_empresa (id, slug, nombre, min_empleados, max_empleados) VALUES 
(1, 'startup', 'Startup (1-10)', 1, 10),
(2, 'pequena', 'Pequeña (11-50)', 11, 50),
(3, 'mediana', 'Mediana (51-200)', 51, 200),
(4, 'grande', 'Grande (201-1000)', 201, 1000),
(5, 'enterprise', 'Enterprise (1000+)', 1000, 999999)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- Insertar sectores
INSERT INTO sectores (id, slug, nombre) VALUES 
(1, 'tecnologia', 'Tecnología'),
(2, 'fintech', 'Fintech'),
(3, 'ecommerce', 'E-commerce'),
(4, 'salud', 'Salud'),
(5, 'educacion', 'Educación'),
(6, 'consultoria', 'Consultoría'),
(7, 'manufactura', 'Manufactura'),
(8, 'retail', 'Retail'),
(9, 'servicios', 'Servicios'),
(10, 'gobierno', 'Gobierno'),
(11, 'ong', 'ONG'),
(12, 'medios', 'Medios y Entretenimiento')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- Verificar que los datos se insertaron correctamente
SELECT 'Areas' as tabla, COUNT(*) as total FROM areas
UNION ALL
SELECT 'Niveles' as tabla, COUNT(*) as total FROM niveles
UNION ALL
SELECT 'Roles' as tabla, COUNT(*) as total FROM roles
UNION ALL
SELECT 'Relaciones' as tabla, COUNT(*) as total FROM relaciones
UNION ALL
SELECT 'Tamaños Empresa' as tabla, COUNT(*) as total FROM tamanos_empresa
UNION ALL
SELECT 'Sectores' as tabla, COUNT(*) as total FROM sectores
ORDER BY tabla;
