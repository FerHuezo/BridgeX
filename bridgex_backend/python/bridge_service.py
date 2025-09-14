#! /usr/bin/env python3
# bridge_service.py
# Reads JSON from stdin, tries to call MATLAB Engine via matlab.engine,
# otherwise returns a dummy analysis.

import sys
import json
import traceback
import logging

# Configurar logging para depuración
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)

def dummy_analysis(data):
    """Análisis dummy mejorado con valores más realistas"""
    logging.info("Ejecutando análisis dummy")
    
    beams = data.get('beams', [])
    nodes = data.get('nodes', [])
    num_beams = len(beams)
    num_nodes = len(nodes)
    
    logging.info(f"Procesando {num_nodes} nodos y {num_beams} vigas")
    
    import random
    
    # Simular estrés basado en la geometría del puente
    stresses = []
    for i, beam in enumerate(beams):
        if len(beam) >= 2:
            start_idx, end_idx = beam[0], beam[1]
            if start_idx < len(nodes) and end_idx < len(nodes):
                # Calcular longitud de la viga para estrés más realista
                node1 = nodes[start_idx]
                node2 = nodes[end_idx]
                if len(node1) >= 2 and len(node2) >= 2:
                    length = ((node2[0] - node1[0])**2 + (node2[1] - node1[1])**2)**0.5
                    # Estrés inversamente proporcional a la longitud (simplificado)
                    base_stress = max(50e6, min(300e6, 150e6 / max(length/100, 1)))
                    stress = base_stress * (0.8 + random.random() * 0.4)
                else:
                    stress = random.random() * 200e6
            else:
                stress = random.random() * 200e6
        else:
            stress = random.random() * 200e6
        stresses.append(stress)
    
    max_stress = max(stresses) if stresses else 0
    
    # Determinar estado basado en estrés máximo
    yield_strength = 250e6  # Acero típico
    safety_factor = yield_strength / max_stress if max_stress > 0 else float('inf')
    status = "safe" if safety_factor > 2.0 else "unsafe"
    
    result = {
        "status": status,
        "maxStress": max_stress,
        "stresses": stresses,
        "safetyFactor": round(safety_factor, 2),
        "backend": "dummy",
        "analysis_info": {
            "nodes_count": num_nodes,
            "beams_count": num_beams,
            "yield_strength": yield_strength
        }
    }
    
    logging.info(f"Análisis completado: {status}, factor seguridad: {safety_factor:.2f}")
    return result

def matlab_analysis(data):
    """Análisis usando MATLAB Engine"""
    logging.info("Intentando análisis con MATLAB")
    
    try:
        import matlab.engine
        logging.info("MATLAB engine importado exitosamente")
        
        eng = matlab.engine.start_matlab()
        logging.info("MATLAB engine iniciado")
        
        # Agregar directorio actual al path de MATLAB
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        matlab_dir = os.path.join(os.path.dirname(current_dir), 'matlab')
        
        logging.info(f"Agregando directorio MATLAB: {matlab_dir}")
        eng.addpath(matlab_dir, nargout=0)
        
        # Convertir datos de Python a JSON string para MATLAB
        json_str = json.dumps(data)
        logging.info(f"Enviando a MATLAB: {json_str[:200]}...")
        
        try:
            # Llamar función MATLAB
            res = eng.analyzeBridge(json_str, nargout=1)
            logging.info(f"MATLAB devolvió: {str(res)[:200]}...")
            
            # Procesar resultado
            if isinstance(res, str):
                result = json.loads(res)
                result["backend"] = "matlab"
                return result
            else:
                # Si MATLAB devolvió un tipo diferente
                logging.warning(f"MATLAB devolvió tipo inesperado: {type(res)}")
                return {
                    "status": "error",
                    "message": "Tipo de retorno inesperado de MATLAB",
                    "raw": str(res),
                    "backend": "matlab_error"
                }
                
        finally:
            eng.quit()
            logging.info("MATLAB engine cerrado")
            
    except ImportError:
        logging.error("MATLAB engine no disponible - matlab.engine no se puede importar")
        raise
    except Exception as e:
        logging.error(f"Error en análisis MATLAB: {str(e)}")
        raise

def main():
    logging.info("=== Iniciando bridge_service.py ===")
    
    try:
        # Leer datos de stdin
        raw = sys.stdin.read()
        logging.info(f"Datos recibidos (longitud: {len(raw)})")
        
        if raw.strip():
            data = json.loads(raw)
            logging.info(f"JSON parseado exitosamente: {len(data)} campos")
        else:
            data = {}
            logging.warning("No se recibieron datos, usando diccionario vacío")
            
    except json.JSONDecodeError as e:
        logging.error(f"Error parseando JSON: {e}")
        print(json.dumps({"error": "invalid input", "details": str(e)}))
        sys.exit(1)
    except Exception as e:
        logging.error(f"Error leyendo entrada: {e}")
        print(json.dumps({"error": "input error", "details": str(e)}))
        sys.exit(1)

    # Intentar análisis MATLAB primero
    try:
        logging.info("Intentando análisis MATLAB...")
        result = matlab_analysis(data)
        logging.info("Análisis MATLAB exitoso")
        
    except Exception as matlab_error:
        logging.warning(f"MATLAB falló: {matlab_error}")
        logging.info("Fallback a análisis dummy")
        
        # Imprimir traceback completo para depuración
        traceback.print_exc(file=sys.stderr)
        
        # Fallback a dummy
        result = dummy_analysis(data)

    # Enviar resultado
    output = json.dumps(result)
    logging.info(f"Enviando resultado (longitud: {len(output)})")
    sys.stdout.write(output)
    sys.stdout.flush()
    
    logging.info("=== bridge_service.py completado ===")

if __name__ == '__main__':
    main()