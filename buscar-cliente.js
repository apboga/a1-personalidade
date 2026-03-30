export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token não fornecido' });
    }

    if (!/^[a-z0-9]{6,20}$/.test(token)) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = 'app3Il8j8D0iBrcCI';
    const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;
    const HEADERS = {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    };

    if (!AIRTABLE_TOKEN) {
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    // Buscar link pelo token — retorna debug completo
    const filterFormula = encodeURIComponent(`{token}='${token}'`);
    const url = `${BASE_URL}/Links_Gerados?filterByFormula=${filterFormula}`;
    const linksRes = await fetch(url, { headers: HEADERS });
    const linksData = await linksRes.json();

    // Retorna debug para diagnóstico
    return res.status(200).json({
      debug: true,
      token,
      url,
      status: linksRes.status,
      records_count: linksData.records ? linksData.records.length : 0,
      raw: linksData
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
