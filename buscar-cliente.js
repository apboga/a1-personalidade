// ============================================================================
// VERCEL SERVERLESS FUNCTION: api/buscar-cliente.js
// ============================================================================
// Função para buscar dados do cliente no Airtable usando o token
// Endpoint: GET /api/buscar-cliente?token=9fejr8oza8tm
// ============================================================================

export default async function handler(req, res) {
  // Apenas GET é permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Extrair token da query string
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token não fornecido' });
    }

    // Validar    // Validar formato do token (6-20 caracteres alphanumericos)
    if (!/^[a-z0-9]{6,20}$/.test(token)) {
      return res.status(400).json({ error: 'Token inválido' });
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
    // PASSO 1: Buscar o link na tabela Links_Gerados
    // ========================================================================
    const filterFormula = encodeURIComponent(`{token}='${token}'`);
    const linksUrl = `${AIRTABLE_API_URL}/${BASE_ID}/Links_Gerados?filterByFormula=${filterFormula}`;

    const linksResponse = await fetch(linksUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!linksResponse.ok) {
      console.error(`Erro ao buscar link: ${linksResponse.status}`);
      return res.status(404).json({ error: 'Link não encontrado' });
    }

    const linksData = await linksResponse.json();

    if (!linksData.records || linksData.records.length === 0) {
      return res.status(404).json({ error: 'Token inválido ou expirado' });
    }

    const linkRecord = linksData.records[0];
    const linkId = linkRecord.id;
    const clienteId = linkRecord.fields.cliente_link?.[0]?.id; // ID do cliente linkado
    const assessmentId = linkRecord.fields.assessment_id?.[0]?.id; // ID do assessment linkado
    const usado = linkRecord.fields.usado || false;

    // Verificar se o link já foi usado
    if (usado) {
      return res.status(403).json({ error: 'Este link já foi utilizado' });
    }

    // ========================================================================
    // PASSO 2: Buscar dados do cliente na tabela Clientes
    // ========================================================================
    const clienteUrl = `${AIRTABLE_API_URL}/${BASE_ID}/Clientes/${clienteId}`;

    const clienteResponse = await fetch(clienteUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!clienteResponse.ok) {
      console.error(`Erro ao buscar cliente: ${clienteResponse.status}`);
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const clienteData = await clienteResponse.json();
    const clienteName = clienteData.fields.nome || 'Cliente';
    const clienteEmail = clienteData.fields.email || '';

    // ========================================================================
    // PASSO 3: Buscar dados do assessment na tabela Assessments_Realizados
    // ========================================================================
    const assessmentUrl = `${AIRTABLE_API_URL}/${BASE_ID}/Assessments_Realizados/${assessmentId}`;

    const assessmentResponse = await fetch(assessmentUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!assessmentResponse.ok) {
      console.error(`Erro ao buscar assessment: ${assessmentResponse.status}`);
      return res.status(404).json({ error: 'Assessment não encontrado' });
    }

    const assessmentData = await assessmentResponse.json();
    const assessmentType = assessmentData.fields.tipo_assessment || 'A1-Personalidade';

    // ========================================================================
    // PASSO 4: Retornar dados para o frontend
    // ========================================================================
    return res.status(200).json({
      success: true,
      data: {
        clienteName,
        clienteEmail,
        assessmentType,
        token,
        linkId,
        clienteId,
        assessmentId
      }
    });

  } catch (error) {
    console.error('Erro na função buscar-cliente:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar requisição',
      message: error.message 
    });
  }
}
