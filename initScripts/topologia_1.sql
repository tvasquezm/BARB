-- 1. Limpieza preventiva
DELETE FROM topologia_conexion;
DELETE FROM topologia_nodo;
DELETE FROM topologia_zona;

-- 2. Insertar Zonas
INSERT INTO topologia_zona (zona_id, nombre, descripcion, planta_id) VALUES
(1, 'Zona de Control', 'Gabinete eléctrico principal, PLC y HMI', 1),
(2, 'Zona de Potencia y Motores', 'Servomotores de los ejes X, Y, Z y Husillo', 1),
(3, 'Zona de Fluidos y Neumática', 'Sistemas de refrigeración y lubricación', 1);

-- 3. Insertar Nodos
INSERT INTO topologia_nodo (nodo_id, nombre, tipo, estado, maquina_id, planta_id, position_x, position_y) VALUES
(1, 'HMI / Panel de Control', 'hub', 'operational', 1, 1, 100, 250),
(2, 'PLC Principal', 'controller', 'operational', 1, 1, 250, 250),
(3, 'Variador de Frecuencia', 'controller', 'operational', 1, 1, 400, 100),
(4, 'Motor Husillo (Spindle)', 'machine', 'operational', 1, 1, 550, 100),
(5, 'Servo Driver X', 'controller', 'operational', 1, 1, 400, 220),
(6, 'Motor Eje X', 'machine', 'operational', 1, 1, 550, 220),
(7, 'Servo Driver Y', 'controller', 'operational', 1, 1, 400, 340),
(8, 'Motor Eje Y', 'machine', 'operational', 1, 1, 550, 340),
(9, 'Bomba de Refrigerante', 'machine', 'operational', 1, 1, 400, 460),
(10, 'Sensor de Flujo', 'sensor', 'warning', 1, 1, 250, 460);

-- 4. Insertar Conexiones (Usando la columna 'tipo' con sus ENUMs correspondientes)
INSERT INTO topologia_conexion (conexion_id, nodo_origen_id, nodo_destino_id, tipo) VALUES
(1, 1, 2, 'data'),       -- HMI -> PLC
(2, 2, 3, 'data'),       -- PLC -> Variador
(3, 3, 4, 'electrical'), -- Variador -> Motor Spindle
(4, 2, 5, 'data'),       -- PLC -> Servo Driver X
(5, 5, 6, 'electrical'), -- Servo Driver X -> Motor X
(6, 2, 7, 'data'),       -- PLC -> Servo Driver Y
(7, 7, 8, 'electrical'), -- Servo Driver Y -> Motor Y
(8, 2, 9, 'electrical'), -- PLC -> Bomba
(9, 10, 2, 'hydraulic');  -- Sensor -> PLC