// ============================================================================
// VERCEL SERVERLESS FUNCTION: api/salvar-assessment.js
// ============================================================================
// Função para salvar os resultados do assessment no Airtable
// Endpoint: POST /api/salvar-assessment
// ============================================================================

export default async function handler(req, res) {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Extrair dados do corpo da requisição
    const {
      assessmentId,
      linkId,
      clienteId,
      token,
      scores,           // { extroversao: 8.5, abertura: 7.2, ... }
      perguntasAbertas, // { q1: "pergunta1", q2: "pergunta2", ... }
      respostasAbertas, // { q1: "resposta1", q2: "resposta2", ... }
      analiseResumo,    // string com análise resumida
      analiseCompleta   // string com análise completa
    } = req.body;

    // Validar campos obrigatórios
    if (!assessmentId || !linkId || !clienteId || !token) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios faltando: assessmentId, linkId, clienteId, token' 
      });
    }

    // Obter variáveis de ambiente
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = 'app3Il8j8D0iBrcCI';
    const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

    if (!AIRTABLE_TOKEN) {
      console.error('AIRTABLE_TOKEN não configurado');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    // ========================================================================
    // PASSO 1: Atualizar o assessment com os resultados
    // ========================================================================
    const assessmentUpdateUrl = `${AIRTABLE_API_URL}/${BASE_ID}/Assessments_Realizados/${assessmentId}`;

    const assessmentUpdatePayload = {
      fields: {
        'scores_json': JSON.stringify(scores || {}),
        'perguntas_abertas_json': JSON.stringify(perguntasAbertas || {}),
        'respostas_abertas_json': JSON.stringify(respostasAbertas || {}),
        'analise_resumo': analiseResumo || '',
        'analise_completa': analiseCompleta || '',
        'status': 'concluido'  // Marcar como concluído
      }
    };

    const assessmentUpdateResponse = await fetch(assessmentUpdateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assessmentUpdatePayload)
    });

    if (!assessmentUpdateResponse.ok) {
      const errorData = await assessmentUpdateResponse.json();
      console.error(`Erro ao atualizar assessment: ${assessmentUpdateResponse.status}`, errorData);
      return res.status(500).json({ 
        error: 'Erro ao salvar resultados do assessment',
        details: errorData
      });
    }

    console.log(`Assessment ${assessmentId} atualizado com sucesso`);

    // ========================================================================
    // PASSO 2: Marcar o link como "usado"
    // ========================================================================
    const linkUpdateUrl = `${AIRTABLE_API_URL}/${BASE_ID}/Links_Gerados/${linkId}`;

    const linkUpdatePayload = {
      fields: {
        'usado': true
      }
    };

    const linkUpdateResponse = await fetch(linkUpdateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(linkUpdatePayload)
    });

    if (!linkUpdateResponse.ok) {
      const errorData = await linkUpdateResponse.json();
      console.error(`Erro ao marcar link como usado: ${linkUpdateResponse.status}`, errorData);
      return res.status(500).json({ 
        error: 'Erro ao marcar link como utilizado',
        details: errorData
      });
    }

    console.log(`Link ${linkId} marcado como usado`);

    // ========================================================================
    // PASSO 3: Retornar sucesso
    // ========================================================================
    return res.status(200).json({
      success: true,
      message: 'Assessment salvo com sucesso',
      data: {
        assessmentId,
        linkId,
        clienteId,
        token,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro na função salvar-assessment:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar requisição',
      message: error.message 
    });
  }
}
