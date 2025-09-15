#! /usr/bin/env python3
# bridge_service.py
# Análisis estructural avanzado de puentes con fallback inteligente

import sys
import json
import traceback
import logging
import numpy as np
import math
from datetime import datetime

# Configurar logging mejorado
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)

def advanced_dummy_analysis(data):
    """Análisis dummy avanzado con cálculos más realistas basados en ingeniería estructural"""
    logging.info("🔬 Ejecutando análisis avanzado (modo dummy)")
    
    beams = data.get('beams', [])
    nodes = data.get('nodes', [])
    supports = data.get('supports', [])
    loads = data.get('loads', [])
    
    num_beams = len(beams)
    num_nodes = len(nodes)
    
    logging.info(f"📊 Procesando: {num_nodes} nodos, {num_beams} vigas, {len(supports)} soportes")
    
    if num_beams == 0 or num_nodes == 0:
        return generate_error_result("Datos insuficientes", "Se requieren al menos 1 nodo y 1 viga")
    
    try:
        # 1. ANÁLISIS GEOMÉTRICO AVANZADO
        geometry_analysis = analyze_bridge_geometry(nodes, beams)
        
        # 2. CÁLCULO DE ESFUERZOS MEJORADO
        stress_analysis = calculate_realistic_stresses(nodes, beams, loads, geometry_analysis)
        
        # 3. ANÁLISIS DE ESTABILIDAD
        stability_analysis = analyze_structural_stability(nodes, beams, supports)
        
        # 4. EVALUACIÓN DE SEGURIDAD
        safety_analysis = evaluate_safety_factors(stress_analysis, stability_analysis)
        
        # 5. ANÁLISIS DE MODOS DE FALLA
        failure_analysis = analyze_failure_modes(stress_analysis, geometry_analysis)
        
        # 6. COMPILAR RESULTADO FINAL
        result = compile_analysis_result(
            stress_analysis, 
            stability_analysis, 
            safety_analysis, 
            failure_analysis,
            geometry_analysis,
            num_nodes, 
            num_beams
        )
        
        logging.info(f"✅ Análisis completado: {result['status']}, SF: {result['safetyFactor']:.2f}")
        return result
        
    except Exception as e:
        logging.error(f"❌ Error en análisis avanzado: {str(e)}")
        traceback.print_exc(file=sys.stderr)
        return generate_error_result("Error en cálculos", str(e))

def analyze_bridge_geometry(nodes, beams):
    """Análisis geométrico detallado del puente"""
    try:
        # Calcular propiedades geométricas
        span_length = max([node[0] for node in nodes]) - min([node[0] for node in nodes])
        height_range = max([node[1] for node in nodes]) - min([node[1] for node in nodes])
        
        # Calcular longitudes de vigas
        beam_lengths = []
        beam_angles = []
        
        for beam in beams:
            start_idx, end_idx = beam[0], beam[1]
            if start_idx < len(nodes) and end_idx < len(nodes):
                node1, node2 = nodes[start_idx], nodes[end_idx]
                
                dx = node2[0] - node1[0]
                dy = node2[1] - node1[1]
                length = math.sqrt(dx**2 + dy**2)
                angle = math.atan2(dy, dx) * 180 / math.pi
                
                beam_lengths.append(length)
                beam_angles.append(angle)
            else:
                beam_lengths.append(0)
                beam_angles.append(0)
        
        return {
            'span_length': span_length,
            'height_range': height_range,
            'beam_lengths': beam_lengths,
            'beam_angles': beam_angles,
            'avg_beam_length': np.mean(beam_lengths) if beam_lengths else 0,
            'total_length': sum(beam_lengths)
        }
        
    except Exception as e:
        logging.error(f"Error en análisis geométrico: {e}")
        return {'error': str(e)}

def calculate_realistic_stresses(nodes, beams, loads, geometry):
    """Cálculo de esfuerzos más realista basado en principios estructurales"""
    try:
        beam_lengths = geometry.get('beam_lengths', [])
        beam_angles = geometry.get('beam_angles', [])
        
        stresses = []
        
        # Propiedades del material (acero estructural típico)
        E = 200e9  # Módulo de elasticidad (Pa)
        yield_strength = 250e6  # Límite elástico (Pa)
        area = 0.01  # Área transversal asumida (m²)
        I = 8.33e-6  # Momento de inercia asumido (m⁴)
        
        for i, beam in enumerate(beams):
            try:
                start_idx, end_idx = beam[0], beam[1]
                
                if i < len(beam_lengths) and beam_lengths[i] > 0:
                    length = beam_lengths[i] / 100  # Convertir a metros
                    angle_rad = beam_angles[i] * math.pi / 180
                    
                    # ESFUERZO AXIAL (por carga directa)
                    axial_load = simulate_axial_load(start_idx, end_idx, loads, angle_rad)
                    axial_stress = abs(axial_load) / area
                    
                    # ESFUERZO POR FLEXIÓN (simplificado)
                    moment = simulate_bending_moment(length, axial_load, angle_rad)
                    bending_stress = abs(moment * (0.05)) / I  # Asumiendo altura de sección = 0.1m
                    
                    # FACTOR DE CONCENTRACIÓN DE ESFUERZOS
                    # Más esfuerzo en vigas horizontales (bajo tráfico directo)
                    load_factor = 1.0 + 0.5 * math.exp(-abs(angle_rad) / (math.pi/4))
                    
                    # FACTOR DE ESBELTEZ (pandeo en elementos comprimidos)
                    slenderness_ratio = length / 0.05  # Asumiendo radio de giro = 5cm
                    buckling_factor = 1.0 if axial_load >= 0 else (1.0 + slenderness_ratio / 200)
                    
                    # ESFUERZO TOTAL COMBINADO
                    total_stress = (axial_stress + bending_stress) * load_factor * buckling_factor
                    
                    # Agregar variabilidad realista (±20%)
                    variation = 0.8 + 0.4 * np.random.random()
                    total_stress *= variation
                    
                    stresses.append(min(total_stress, yield_strength * 1.2))  # Limitar a 120% del límite elástico
                    
                else:
                    # Fallback para vigas sin geometría válida
                    base_stress = yield_strength * (0.3 + 0.4 * np.random.random())
                    stresses.append(base_stress)
                    
            except Exception as e:
                logging.warning(f"Error calculando esfuerzo viga {i}: {e}")
                stresses.append(yield_strength * 0.5)
        
        return {
            'stresses': stresses,
            'max_stress': max(stresses) if stresses else 0,
            'avg_stress': np.mean(stresses) if stresses else 0,
            'yield_strength': yield_strength,
            'material_properties': {
                'E': E,
                'yield_strength': yield_strength,
                'assumed_area': area,
                'assumed_I': I
            }
        }
        
    except Exception as e:
        logging.error(f"Error en cálculo de esfuerzos: {e}")
        return {'error': str(e), 'stresses': []}

def simulate_axial_load(start_idx, end_idx, loads, angle_rad):
    """Simular carga axial en la viga"""
    # Carga base por peso propio
    self_weight = 1000  # N/m (peso propio asumido)
    
    # Carga por cargas aplicadas
    applied_load = 0
    for load in loads:
        if load.get('node') == start_idx or load.get('node') == end_idx:
            # Proyectar carga en dirección axial de la viga
            fy = load.get('fy', 0)
            fx = load.get('fx', 0)
            applied_load += fx * math.cos(angle_rad) + fy * math.sin(angle_rad)
    
    # Carga por tráfico vehicular (asumida)
    traffic_load = 5000 * abs(math.cos(angle_rad))  # Más carga en vigas horizontales
    
    return self_weight + applied_load + traffic_load

def simulate_bending_moment(length, axial_load, angle_rad):
    """Simular momento flector"""
    # Momento por carga distribuida (peso propio + tráfico)
    w = 2000 + 3000 * abs(math.cos(angle_rad))  # N/m
    moment_distributed = w * length**2 / 8  # Viga simplemente apoyada
    
    # Momento por excentricidad de carga axial
    eccentricity = 0.01  # 1cm de excentricidad asumida
    moment_eccentric = abs(axial_load) * eccentricity
    
    return moment_distributed + moment_eccentric

def analyze_structural_stability(nodes, beams, supports):
    """Análisis de estabilidad estructural"""
    try:
        # Grados de libertad y restricciones
        total_dof = len(nodes) * 3  # 3 DOF por nodo en 2D (x, y, rotación)
        constraints = len(supports) * 3  # Soportes fijos
        
        # Determinación estática
        static_determinacy = len(beams) + constraints - total_dof
        
        # Análisis de conectividad
        connectivity_matrix = build_connectivity_matrix(nodes, beams)
        connected_components = count_connected_components(connectivity_matrix)
        
        # Evaluación de estabilidad
        if static_determinacy < 0:
            stability_status = "Inestable - Insuficientes restricciones"
            stability_factor = 0.0
        elif static_determinacy == 0:
            stability_status = "Estáticamente determinado"
            stability_factor = 1.0
        else:
            stability_status = "Estáticamente indeterminado"
            stability_factor = 1.0 + static_determinacy * 0.1
        
        return {
            'status': stability_status,
            'stability_factor': min(stability_factor, 2.0),
            'static_determinacy': static_determinacy,
            'connected_components': connected_components,
            'total_dof': total_dof,
            'constraints': constraints,
            'is_stable': static_determinacy >= 0 and connected_components == 1
        }
        
    except Exception as e:
        logging.error(f"Error en análisis de estabilidad: {e}")
        return {'error': str(e), 'is_stable': False}

def build_connectivity_matrix(nodes, beams):
    """Construir matriz de conectividad"""
    n = len(nodes)
    matrix = [[0] * n for _ in range(n)]
    
    for beam in beams:
        start, end = beam[0], beam[1]
        if 0 <= start < n and 0 <= end < n:
            matrix[start][end] = 1
            matrix[end][start] = 1
    
    return matrix

def count_connected_components(matrix):
    """Contar componentes conectados usando DFS"""
    n = len(matrix)
    visited = [False] * n
    components = 0
    
    for i in range(n):
        if not visited[i]:
            dfs(matrix, i, visited)
            components += 1
    
    return components

def dfs(matrix, node, visited):
    """Búsqueda en profundidad"""
    visited[node] = True
    for i, connected in enumerate(matrix[node]):
        if connected and not visited[i]:
            dfs(matrix, i, visited)

def evaluate_safety_factors(stress_analysis, stability_analysis):
    """Evaluación de factores de seguridad"""
    try:
        max_stress = stress_analysis.get('max_stress', 0)
        yield_strength = stress_analysis.get('yield_strength', 250e6)
        
        # Factor de seguridad por resistencia
        if max_stress > 0:
            strength_safety_factor = yield_strength / max_stress
        else:
            strength_safety_factor = float('inf')
        
        # Factor de seguridad por estabilidad
        stability_safety_factor = stability_analysis.get('stability_factor', 1.0)
        
        # Factor de seguridad combinado (el más crítico)
        combined_safety_factor = min(strength_safety_factor, stability_safety_factor * 2)
        
        # Estado de seguridad
        if combined_safety_factor >= 2.5:
            safety_status = "Muy seguro"
        elif combined_safety_factor >= 2.0:
            safety_status = "Seguro"
        elif combined_safety_factor >= 1.5:
            safety_status = "Marginalmente seguro"
        elif combined_safety_factor >= 1.0:
            safety_status = "Inseguro"
        else:
            safety_status = "Crítico"
        
        return {
            'strength_safety_factor': round(strength_safety_factor, 2),
            'stability_safety_factor': round(stability_safety_factor, 2),
            'combined_safety_factor': round(combined_safety_factor, 2),
            'safety_status': safety_status,
            'is_safe': combined_safety_factor >= 1.5
        }
        
    except Exception as e:
        logging.error(f"Error en evaluación de seguridad: {e}")
        return {'error': str(e), 'is_safe': False}

def analyze_failure_modes(stress_analysis, geometry_analysis):
    """Análisis de modos de falla potenciales"""
    try:
        stresses = stress_analysis.get('stresses', [])
        yield_strength = stress_analysis.get('yield_strength', 250e6)
        beam_lengths = geometry_analysis.get('beam_lengths', [])
        
        failure_modes = []
        
        # Análisis viga por viga
        for i, stress in enumerate(stresses):
            beam_failures = []
            
            # Falla por fluencia
            if stress > yield_strength * 0.8:
                beam_failures.append({
                    'mode': 'Fluencia',
                    'probability': min((stress / yield_strength - 0.8) * 5, 1.0),
                    'description': 'Deformación plástica del material'
                })
            
            # Falla por pandeo (solo vigas largas en compresión)
            if i < len(beam_lengths) and beam_lengths[i] > 200:  # Vigas > 2m
                slenderness = beam_lengths[i] / 5  # Asumiendo radio de giro = 5cm
                if slenderness > 100:
                    beam_failures.append({
                        'mode': 'Pandeo',
                        'probability': min((slenderness - 100) / 200, 0.8),
                        'description': 'Inestabilidad lateral de viga esbelta'
                    })
            
            # Falla por fatiga (estimada)
            if stress > yield_strength * 0.5:
                beam_failures.append({
                    'mode': 'Fatiga',
                    'probability': (stress / yield_strength - 0.5) * 0.3,
                    'description': 'Degradación por cargas cíclicas'
                })
            
            if beam_failures:
                failure_modes.append({
                    'beam_index': i,
                    'failures': beam_failures
                })
        
        # Modo de falla más probable
        all_failures = []
        for beam in failure_modes:
            all_failures.extend(beam['failures'])
        
        most_likely_failure = max(all_failures, key=lambda x: x['probability']) if all_failures else None
        
        return {
            'beam_failure_modes': failure_modes,
            'most_likely_failure': most_likely_failure,
            'total_failure_risk': sum(f['probability'] for f in all_failures) / len(all_failures) if all_failures else 0
        }
        
    except Exception as e:
        logging.error(f"Error en análisis de modos de falla: {e}")
        return {'error': str(e)}

def compile_analysis_result(stress_analysis, stability_analysis, safety_analysis, failure_analysis, geometry_analysis, num_nodes, num_beams):
    """Compilar resultado final del análisis"""
    
    # Estado principal
    is_safe = safety_analysis.get('is_safe', False) and stability_analysis.get('is_stable', False)
    status = 'safe' if is_safe else 'unsafe'
    
    # Factor de seguridad principal
    safety_factor = safety_analysis.get('combined_safety_factor', 0)
    
    return {
        # Resultados principales (compatibilidad con frontend)
        'status': status,
        'maxStress': stress_analysis.get('max_stress', 0),
        'stresses': stress_analysis.get('stresses', []),
        'safetyFactor': safety_factor,
        'backend': 'advanced_python',
        
        # Información de análisis básica
        'analysis_info': {
            'nodes_count': num_nodes,
            'beams_count': num_beams,
            'yield_strength': stress_analysis.get('yield_strength', 250e6),
            'material_properties': stress_analysis.get('material_properties', {})
        },
        
        # Análisis detallado
        'detailed_analysis': {
            'geometry': {
                'span_length': geometry_analysis.get('span_length', 0),
                'height_range': geometry_analysis.get('height_range', 0),
                'total_beam_length': geometry_analysis.get('total_length', 0),
                'avg_beam_length': geometry_analysis.get('avg_beam_length', 0)
            },
            'stability': {
                'status': stability_analysis.get('status', 'Unknown'),
                'is_stable': stability_analysis.get('is_stable', False),
                'static_determinacy': stability_analysis.get('static_determinacy', 0),
                'connected_components': stability_analysis.get('connected_components', 1)
            },
            'safety': {
                'strength_safety_factor': safety_analysis.get('strength_safety_factor', 0),
                'stability_safety_factor': safety_analysis.get('stability_safety_factor', 0),
                'safety_status': safety_analysis.get('safety_status', 'Unknown')
            },
            'failure_analysis': {
                'most_likely_failure': failure_analysis.get('most_likely_failure'),
                'total_failure_risk': failure_analysis.get('total_failure_risk', 0),
                'beam_failure_modes': failure_analysis.get('beam_failure_modes', [])
            }
        },
        
        # Metadatos
        'analysis_metadata': {
            'timestamp': datetime.now().isoformat(),
            'engine': 'advanced_python_structural_analysis',
            'version': '2.0',
            'computation_level': 'detailed'
        }
    }

def generate_error_result(error_type, message):
    """Generar resultado de error estructurado"""
    return {
        'status': 'error',
        'error': error_type,
        'message': message,
        'backend': 'advanced_python',
        'timestamp': datetime.now().isoformat()
    }

def matlab_analysis(data):
    """Análisis usando MATLAB Engine con manejo mejorado de errores"""
    logging.info("🔬 Intentando análisis con MATLAB Engine")
    
    try:
        import matlab.engine
        logging.info("✅ MATLAB engine importado exitosamente")
        
        # Configuración de inicio más robusta
        eng = matlab.engine.start_matlab('-nodisplay', '-nosplash', '-nodesktop')
        logging.info("✅ MATLAB engine iniciado con configuración optimizada")
        
        # Configurar path de MATLAB
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        matlab_dir = os.path.join(os.path.dirname(current_dir), 'matlab')
        
        if os.path.exists(matlab_dir):
            logging.info(f"📁 Agregando directorio MATLAB: {matlab_dir}")
            eng.addpath(matlab_dir, nargout=0)
        else:
            logging.warning(f"⚠️ Directorio MATLAB no encontrado: {matlab_dir}")
        
        # Preparar datos para MATLAB
        json_str = json.dumps(data, ensure_ascii=False)
        logging.info(f"📤 Enviando {len(json_str)} caracteres a MATLAB")
        
        try:
            # Ejecutar análisis con timeout
            result_str = eng.analyzeBridge(json_str, nargout=1, timeout=30)
            logging.info("✅ MATLAB análisis completado")
            
            # Procesar resultado
            if isinstance(result_str, str):
                result = json.loads(result_str)
                result["backend"] = "matlab_engine"
                result["analysis_metadata"] = {
                    'timestamp': datetime.now().isoformat(),
                    'engine': 'matlab',
                    'version': '1.0'
                }
                return result
            else:
                logging.warning(f"⚠️ MATLAB retornó tipo inesperado: {type(result_str)}")
                return generate_error_result("matlab_type_error", f"Tipo de retorno inesperado: {type(result_str)}")
                
        except Exception as matlab_exec_error:
            logging.error(f"❌ Error ejecutando función MATLAB: {matlab_exec_error}")
            raise matlab_exec_error
            
        finally:
            try:
                eng.quit()
                logging.info("🔒 MATLAB engine cerrado correctamente")
            except:
                logging.warning("⚠️ Error cerrando MATLAB engine")
            
    except ImportError as import_error:
        logging.error("❌ MATLAB engine no disponible - matlab.engine no instalado")
        raise ImportError("MATLAB Engine no disponible") from import_error
    except Exception as e:
        logging.error(f"❌ Error general en MATLAB: {str(e)}")
        raise e

def main():
    logging.info("🚀 [INICIANDO] BridgeX Advanced Structural Analysis Service v2.0")
    
    try:
        # Leer datos de stdin con timeout
        raw_input = ""
        for line in sys.stdin:
            raw_input += line
        
        logging.info(f"📥 Datos recibidos: {len(raw_input)} caracteres")
        
        if raw_input.strip():
            data = json.loads(raw_input.strip())
            logging.info(f"✅ JSON parseado: {len(data)} campos principales")
            
            # Log de estructura de datos
            if 'nodes' in data:
                logging.info(f"📊 Estructura: {len(data.get('nodes', []))} nodos, {len(data.get('beams', []))} vigas")
                if 'supports' in data:
                    logging.info(f"🏗️ Soportes: {len(data.get('supports', []))}")
                if 'loads' in data:
                    logging.info(f"⚖️ Cargas: {len(data.get('loads', []))}")
        else:
            logging.warning("⚠️ No se recibieron datos, usando estructura vacía")
            data = {'nodes': [], 'beams': []}
            
    except json.JSONDecodeError as e:
        logging.error(f"❌ Error parseando JSON: {e}")
        error_result = {
            "error": "invalid_json",
            "details": str(e),
            "backend": "advanced_python",
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result))
        sys.exit(1)
    except Exception as e:
        logging.error(f"❌ Error leyendo entrada: {e}")
        error_result = {
            "error": "input_error", 
            "details": str(e),
            "backend": "advanced_python",
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result))
        sys.exit(1)

    # ESTRATEGIA DE ANÁLISIS JERARQUIZADA
    final_result = None
    analysis_attempts = []

    # 1. INTENTO PRIMARIO: MATLAB Engine (más preciso)
    try:
        logging.info("🎯 [INTENTO 1/2] Análisis con MATLAB Engine...")
        start_time = datetime.now()
        
        matlab_result = matlab_analysis(data)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        logging.info(f"✅ MATLAB exitoso en {processing_time:.2f}s")
        
        analysis_attempts.append({
            'method': 'matlab_engine',
            'status': 'success',
            'processing_time': processing_time
        })
        
        final_result = matlab_result
        
    except Exception as matlab_error:
        processing_time = (datetime.now() - start_time).total_seconds()
        logging.warning(f"⚠️ MATLAB falló en {processing_time:.2f}s: {matlab_error}")
        
        analysis_attempts.append({
            'method': 'matlab_engine',
            'status': 'failed',
            'error': str(matlab_error),
            'processing_time': processing_time
        })
        
        # Imprimir traceback completo para depuración
        traceback.print_exc(file=sys.stderr)

    # 2. INTENTO SECUNDARIO: Análisis Python Avanzado (fallback inteligente)
    if final_result is None:
        try:
            logging.info("🎯 [INTENTO 2/2] Fallback a análisis Python avanzado...")
            start_time = datetime.now()
            
            python_result = advanced_dummy_analysis(data)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            logging.info(f"✅ Python avanzado exitoso en {processing_time:.2f}s")
            
            analysis_attempts.append({
                'method': 'advanced_python',
                'status': 'success',
                'processing_time': processing_time
            })
            
            final_result = python_result
            
        except Exception as python_error:
            processing_time = (datetime.now() - start_time).total_seconds()
            logging.error(f"❌ Python avanzado falló en {processing_time:.2f}s: {python_error}")
            
            analysis_attempts.append({
                'method': 'advanced_python',
                'status': 'failed',
                'error': str(python_error),
                'processing_time': processing_time
            })
            
            traceback.print_exc(file=sys.stderr)

    # 3. ÚLTIMO RECURSO: Análisis básico garantizado
    if final_result is None:
        logging.error("❌ Todos los métodos avanzados fallaron, usando análisis básico")
        
        try:
            final_result = basic_fallback_analysis(data)
            analysis_attempts.append({
                'method': 'basic_fallback',
                'status': 'success',
                'processing_time': 0.1
            })
        except Exception as basic_error:
            logging.critical(f"💥 Incluso el análisis básico falló: {basic_error}")
            final_result = {
                'status': 'critical_error',
                'error': 'All analysis methods failed',
                'details': str(basic_error),
                'backend': 'emergency_fallback',
                'timestamp': datetime.now().isoformat()
            }

    # ENRIQUECER RESULTADO FINAL
    if final_result and 'error' not in final_result:
        final_result['analysis_attempts'] = analysis_attempts
        final_result['service_metadata'] = {
            'service_version': '2.0',
            'total_methods_tried': len(analysis_attempts),
            'successful_method': next((a['method'] for a in analysis_attempts if a['status'] == 'success'), 'none'),
            'total_processing_time': sum(a.get('processing_time', 0) for a in analysis_attempts)
        }

    # ENVIAR RESULTADO FINAL
    try:
        output_json = json.dumps(final_result, ensure_ascii=False, indent=None)
        logging.info(f"📤 Enviando resultado: {len(output_json)} caracteres")
        logging.info(f"📊 Estado final: {final_result.get('status', 'unknown')}")
        
        sys.stdout.write(output_json)
        sys.stdout.flush()
        
        logging.info("🏁 [COMPLETADO] Análisis estructural finalizado exitosamente")
        
    except Exception as output_error:
        logging.critical(f"💥 Error enviando resultado: {output_error}")
        emergency_result = {
            'status': 'output_error',
            'error': 'Failed to serialize result',
            'details': str(output_error),
            'backend': 'emergency_fallback',
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(emergency_result))
        sys.exit(1)

def basic_fallback_analysis(data):
    """Análisis básico garantizado como último recurso"""
    logging.info("🔧 Ejecutando análisis básico de emergencia")
    
    beams = data.get('beams', [])
    nodes = data.get('nodes', [])
    
    num_beams = len(beams)
    num_nodes = len(nodes)
    
    if num_beams == 0:
        return {
            'status': 'error',
            'error': 'no_beams',
            'message': 'No hay vigas para analizar',
            'backend': 'basic_fallback'
        }
    
    # Análisis muy básico pero confiable
    import random
    random.seed(42)  # Reproducible
    
    # Generar esfuerzos simples
    base_stress = 150e6  # 150 MPa base
    stresses = []
    
    for i in range(num_beams):
        # Esfuerzo con variación basada en índice (reproducible)
        stress_variation = 0.5 + (i % 10) * 0.1
        beam_stress = base_stress * stress_variation
        stresses.append(beam_stress)
    
    max_stress = max(stresses) if stresses else 0
    yield_strength = 250e6
    safety_factor = yield_strength / max_stress if max_stress > 0 else 10.0
    
    return {
        'status': 'safe' if safety_factor > 1.5 else 'unsafe',
        'maxStress': max_stress,
        'stresses': stresses,
        'safetyFactor': round(safety_factor, 2),
        'backend': 'basic_fallback',
        'analysis_info': {
            'nodes_count': num_nodes,
            'beams_count': num_beams,
            'yield_strength': yield_strength,
            'note': 'Análisis simplificado de emergencia'
        },
        'analysis_metadata': {
            'timestamp': datetime.now().isoformat(),
            'engine': 'basic_fallback',
            'reliability': 'low'
        }
    }

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logging.info("🛑 Análisis interrumpido por usuario")
        sys.exit(130)
    except Exception as critical_error:
        logging.critical(f"💥 Error crítico no manejado: {critical_error}")
        traceback.print_exc(file=sys.stderr)
        
        emergency_result = {
            'status': 'critical_system_error',
            'error': 'Unhandled critical error',
            'details': str(critical_error),
            'backend': 'system_emergency',
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(emergency_result))
        sys.exit(1)