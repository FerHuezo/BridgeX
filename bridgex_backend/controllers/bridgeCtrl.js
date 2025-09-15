import { runPythonBridgeAnalysis } from '../services/pythonService.js';

// Función para validar y enriquecer datos de entrada
const validateAndEnrichBridgeData = (bridgeData) => {
  const errors = [];
  const warnings = [];
  
  // Validaciones básicas
  if (!bridgeData.nodes || !Array.isArray(bridgeData.nodes)) {
    errors.push('Nodos requeridos y deben ser un array');
  }
  
  if (!bridgeData.beams || !Array.isArray(bridgeData.beams)) {
    errors.push('Vigas requeridas y deben ser un array');
  }
  
  if (bridgeData.nodes && bridgeData.nodes.length < 2) {
    errors.push('Se requieren al menos 2 nodos');
  }
  
  if (bridgeData.beams && bridgeData.beams.length < 1) {
    errors.push('Se requiere al menos 1 viga');
  }
  
  // Validaciones avanzadas
  if (bridgeData.nodes && bridgeData.beams) {
    const maxNodeIndex = bridgeData.nodes.length - 1;
    
    bridgeData.beams.forEach((beam, idx) => {
      if (!Array.isArray(beam) || beam.length < 2) {
        errors.push(`Viga ${idx}: formato inválido`);
        return;
      }
      
      const [start, end] = beam;
      if (start < 0 || start > maxNodeIndex || end < 0 || end > maxNodeIndex) {
        errors.push(`Viga ${idx}: índices de nodos fuera de rango`);
      }
      
      if (start === end) {
        errors.push(`Viga ${idx}: no puede conectar un nodo consigo mismo`);
      }
    });
    
    // Verificar conectividad básica
    const nodeConnections = new Array(bridgeData.nodes.length).fill(0);
    bridgeData.beams.forEach(([start, end]) => {
      if (start >= 0 && start < nodeConnections.length) nodeConnections[start]++;
      if (end >= 0 && end < nodeConnections.length) nodeConnections[end]++;
    });
    
    const isolatedNodes = nodeConnections.filter(count => count === 0).length;
    if (isolatedNodes > 0) {
      warnings.push(`${isolatedNodes} nodo(s) aislado(s) detectado(s)`);
    }
    
    // Verificar soportes
    if (!bridgeData.supports || bridgeData.supports.length === 0) {
      warnings.push('No se detectaron nodos de soporte - puente puede ser inestable');
    }
  }
  
  // Enriquecer con datos adicionales
  const enrichedData = {
    ...bridgeData,
    metadata: {
      ...bridgeData.metadata,
      validation: {
        errors,
        warnings,
        isValid: errors.length === 0
      },
      analysis_timestamp: new Date().toISOString(),
      node_count: bridgeData.nodes ? bridgeData.nodes.length : 0,
      beam_count: bridgeData.beams ? bridgeData.beams.length : 0
    }
  };
  
  return enrichedData;
};

// Función para calcular métricas adicionales
const calculateDesignMetrics = (bridgeData, analysisResult) => {
  const metrics = {
    structural: {},
    economic: {},
    efficiency: {},
    stability: {}
  };
  
  try {
    const nodeCount = bridgeData.nodes.length;
    const beamCount = bridgeData.beams.length;
    
    // Métricas estructurales
    metrics.structural = {
      node_beam_ratio: beamCount / nodeCount,
      connectivity_index: (beamCount * 2) / nodeCount, // Promedio de conexiones por nodo
      span_length: calculateSpanLength(bridgeData.nodes),
      max_node_degree: calculateMaxNodeDegree(bridgeData.nodes, bridgeData.beams)
    };
    
    // Métricas económicas (simuladas)
    const baseCostPerNode = 500; // USD
    const baseCostPerBeam = 1000; // USD
    metrics.economic = {
      estimated_cost: (nodeCount * baseCostPerNode) + (beamCount * baseCostPerBeam),
      cost_per_span_meter: ((nodeCount * baseCostPerNode) + (beamCount * baseCostPerBeam)) / Math.max(metrics.structural.span_length, 1),
      material_efficiency: beamCount / (nodeCount + beamCount) // Proporción de material estructural
    };
    
    // Métricas de eficiencia
    if (analysisResult.stresses && analysisResult.stresses.length > 0) {
      const stresses = analysisResult.stresses;
      const avgStress = stresses.reduce((a, b) => a + b, 0) / stresses.length;
      const maxStress = Math.max(...stresses);
      const minStress = Math.min(...stresses);
      const yieldStrength = analysisResult.analysis_info?.yield_strength || 250e6;
      
      metrics.efficiency = {
        stress_utilization: (avgStress / yieldStrength) * 100,
        stress_uniformity: 1 - ((maxStress - minStress) / maxStress), // 0-1, donde 1 es perfectamente uniforme
        over_designed_beams: stresses.filter(s => s < yieldStrength * 0.3).length,
        critical_beams: stresses.filter(s => s > yieldStrength * 0.8).length
      };
    }
    
    // Métricas de estabilidad
    metrics.stability = {
      safety_margin: analysisResult.safetyFactor > 1 ? (analysisResult.safetyFactor - 1) * 100 : 0,
      redundancy_level: calculateRedundancy(bridgeData.beams, bridgeData.nodes),
      support_adequacy: (bridgeData.supports?.length || 0) / nodeCount
    };
    
  } catch (error) {
    console.error('Error calculando métricas:', error);
    metrics.error = error.message;
  }
  
  return metrics;
};

// Funciones auxiliares para métricas
const calculateSpanLength = (nodes) => {
  if (!nodes || nodes.length < 2) return 0;
  
  const xCoords = nodes.map(node => Array.isArray(node) ? node[0] : node.x);
  return Math.max(...xCoords) - Math.min(...xCoords);
};

const calculateMaxNodeDegree = (nodes, beams) => {
  if (!nodes || !beams) return 0;
  
  const degrees = new Array(nodes.length).fill(0);
  beams.forEach(([start, end]) => {
    if (start >= 0 && start < degrees.length) degrees[start]++;
    if (end >= 0 && end < degrees.length) degrees[end]++;
  });
  
  return Math.max(...degrees);
};

const calculateRedundancy = (beams, nodes) => {
  if (!beams || !nodes) return 0;
  
  // Redundancia = (vigas actuales - vigas mínimas) / vigas mínimas
  // Para un puente estable, mínimo = nodos - 1 (estructura de árbol)
  const minBeams = Math.max(1, nodes.length - 1);
  return Math.max(0, (beams.length - minBeams) / minBeams);
};

// Función para generar recomendaciones inteligentes
const generateIntelligentRecommendations = (bridgeData, analysisResult, metrics) => {
  const recommendations = [];
  const priorities = { high: [], medium: [], low: [] };
  
  try {
    // Análisis de seguridad crítica
    if (analysisResult.status === 'unsafe' || analysisResult.safetyFactor < 1.5) {
      priorities.high.push({
        category: 'Seguridad',
        issue: 'Factor de seguridad insuficiente',
        recommendation: 'Agregar vigas de refuerzo o reducir cargas',
        impact: 'Crítico - Riesgo de colapso'
      });
    }
    
    // Análisis de eficiencia estructural
    if (metrics.efficiency?.stress_utilization < 30) {
      priorities.low.push({
        category: 'Eficiencia',
        issue: 'Puente sobredimensionado',
        recommendation: 'Considerar reducir material para optimizar costos',
        impact: 'Económico - Posible ahorro en materiales'
      });
    }
    
    if (metrics.efficiency?.stress_utilization > 80) {
      priorities.high.push({
        category: 'Eficiencia',
        issue: 'Puente subdimensionado',
        recommendation: 'Agregar elementos estructurales o aumentar secciones',
        impact: 'Seguridad - Material trabajando al límite'
      });
    }
    
    // Análisis de conectividad
    if (metrics.structural?.connectivity_index < 2) {
      priorities.medium.push({
        category: 'Conectividad',
        issue: 'Conectividad insuficiente',
        recommendation: 'Agregar vigas diagonales o arriostramientos',
        impact: 'Estabilidad - Mejora rigidez estructural'
      });
    }
    
    // Análisis de redundancia
    if (metrics.stability?.redundancy_level < 0.2) {
      priorities.medium.push({
        category: 'Redundancia',
        issue: 'Baja redundancia estructural',
        recommendation: 'Agregar elementos alternativos de carga',
        impact: 'Seguridad - Rutas alternativas de carga'
      });
    }
    
    // Análisis de soportes
    if (metrics.stability?.support_adequacy < 0.2) {
      priorities.high.push({
        category: 'Soportes',
        issue: 'Soportes insuficientes',
        recommendation: 'Agregar más nodos de apoyo',
        impact: 'Estabilidad - Fundamental para equilibrio'
      });
    }
    
    // Análisis de uniformidad de estrés
    if (metrics.efficiency?.stress_uniformity < 0.5) {
      priorities.medium.push({
        category: 'Distribución',
        issue: 'Distribución de esfuerzos desigual',
        recommendation: 'Redistribuir geometría para mejor distribución de cargas',
        impact: 'Eficiencia - Mejor aprovechamiento del material'
      });
    }
    
    // Compilar recomendaciones finales
    recommendations.push(...priorities.high, ...priorities.medium, ...priorities.low);
    
    // Si no hay problemas, dar recomendaciones positivas
    if (recommendations.length === 0) {
      recommendations.push({
        category: 'Optimización',
        issue: 'Diseño equilibrado',
        recommendation: 'Diseño apropiado. Considerar análisis dinámico para cargas móviles',
        impact: 'Mejora - Análisis avanzado'
      });
    }
    
  } catch (error) {
    console.error('Error generando recomendaciones:', error);
    recommendations.push({
      category: 'Error',
      issue: 'Error en análisis de recomendaciones',
      recommendation: 'Revisar datos de entrada',
      impact: 'Sistema - Verificar configuración'
    });
  }
  
  return recommendations;
};

export const analyzeBridge = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log(`🔬 [${new Date().toISOString()}] Iniciando análisis estructural`);
    
    // Validar y enriquecer datos de entrada
    const bridgeData = validateAndEnrichBridgeData(req.body);
    
    // Si hay errores críticos de validación, retornar inmediatamente
    if (!bridgeData.metadata.validation.isValid) {
      console.error('❌ Errores de validación:', bridgeData.metadata.validation.errors);
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: bridgeData.metadata.validation.errors,
        warnings: bridgeData.metadata.validation.warnings,
        timestamp: new Date().toISOString()
      });
    }
    
    // Log de advertencias (no bloquean el análisis)
    if (bridgeData.metadata.validation.warnings.length > 0) {
      console.warn('⚠️ Advertencias detectadas:', bridgeData.metadata.validation.warnings);
    }
    
    console.log(`📊 Procesando: ${bridgeData.metadata.node_count} nodos, ${bridgeData.metadata.beam_count} vigas`);
    
    // Ejecutar análisis principal con Python/MATLAB
    const analysisResult = await runPythonBridgeAnalysis(bridgeData);
    
    // Calcular métricas adicionales
    const designMetrics = calculateDesignMetrics(bridgeData, analysisResult);
    
    // Generar recomendaciones inteligentes
    const recommendations = generateIntelligentRecommendations(bridgeData, analysisResult, designMetrics);
    
    // Compilar resultado final enriquecido
    const enrichedResult = {
      // Resultado principal del análisis
      ...analysisResult,
      
      // Métricas avanzadas
      design_metrics: designMetrics,
      
      // Recomendaciones inteligentes
      recommendations: {
        items: recommendations,
        total_count: recommendations.length,
        high_priority: recommendations.filter(r => r.impact.includes('Crítico') || r.impact.includes('Seguridad')).length
      },
      
      // Metadatos del análisis
      analysis_metadata: {
        processing_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        backend_engine: analysisResult.backend || 'unknown',
        validation_warnings: bridgeData.metadata.validation.warnings,
        api_version: '2.0'
      },
      
      // Resumen ejecutivo
      executive_summary: {
        overall_status: analysisResult.status,
        confidence_level: analysisResult.safetyFactor > 2 ? 'Alto' : 
                         analysisResult.safetyFactor > 1.5 ? 'Medio' : 'Bajo',
        primary_concern: recommendations.length > 0 ? recommendations[0].issue : 'Ninguna',
        estimated_cost: designMetrics.economic?.estimated_cost || 0,
        efficiency_score: Math.round((designMetrics.efficiency?.stress_utilization || 0) * 
                                   (designMetrics.stability?.redundancy_level || 0.5) * 100)
      }
    };
    
    // Log del resultado
    console.log(`✅ Análisis completado en ${Date.now() - startTime}ms`);
    console.log(`📋 Estado: ${enrichedResult.executive_summary.overall_status}`);
    console.log(`⚡ Factor de seguridad: ${analysisResult.safetyFactor}`);
    console.log(`💰 Costo estimado: ${designMetrics.economic?.estimated_cost || 0}`);
    console.log(`🎯 Recomendaciones: ${recommendations.length}`);
    
    // Respuesta exitosa
    res.status(200).json(enrichedResult);
    
  } catch (err) {
    const processingTime = Date.now() - startTime;
    
    console.error(`❌ [${new Date().toISOString()}] Error en análisis (${processingTime}ms):`, err);
    
    // Análisis del tipo de error para respuesta más específica
    let errorResponse = {
      error: 'Error en análisis estructural',
      timestamp: new Date().toISOString(),
      processing_time_ms: processingTime
    };
    
    if (err.message.includes('Python process exited')) {
      errorResponse = {
        ...errorResponse,
        error_type: 'python_process_error',
        details: 'Error en motor de análisis Python/MATLAB',
        suggestion: 'Verificar instalación de dependencias y motor MATLAB',
        technical_details: String(err)
      };
    } else if (err.message.includes('ECONNREFUSED')) {
      errorResponse = {
        ...errorResponse,
        error_type: 'connection_error',
        details: 'No se pudo conectar al motor de análisis',
        suggestion: 'Verificar que los servicios estén ejecutándose',
        technical_details: String(err)
      };
    } else if (err.message.includes('timeout')) {
      errorResponse = {
        ...errorResponse,
        error_type: 'timeout_error',
        details: 'El análisis tardó demasiado tiempo',
        suggestion: 'Simplificar el modelo o verificar recursos del sistema',
        technical_details: String(err)
      };
    } else {
      errorResponse = {
        ...errorResponse,
        error_type: 'general_error',
        details: String(err),
        suggestion: 'Revisar logs del servidor para más detalles'
      };
    }
    
    res.status(500).json(errorResponse);
  }
};