# API de Geração de PDF - Ouse Passar

Documentação para integração externa com o sistema de geração de PDF de simulados.

---

## Endpoint

```
POST https://questoes.appcodigodavida.com.br/api/pdf/simulado
```

---

## Autenticação

Atualmente o endpoint não requer autenticação. Para ambientes de produção, recomenda-se implementar uma API key.

---

## Request

### Headers

```
Content-Type: application/json
```

### Body (JSON)

```json
{
  "simuladoName": "Concurso INSS 2024",
  "preparatorioName": "Técnico do Seguro Social",
  "studentName": "João da Silva",
  "cargo": "Técnico do Seguro Social",
  "totalTime": 180,
  "provaNumber": 0,
  "questions": [
    {
      "id": 1,
      "materia": "Direito Constitucional",
      "assunto": "Direitos Fundamentais",
      "enunciado": "Segundo a Constituição Federal de 1988, são direitos sociais:",
      "parsedAlternativas": [
        { "letter": "A", "text": "A educação, a saúde, a alimentação, o trabalho, a moradia." },
        { "letter": "B", "text": "Apenas a educação e a saúde." },
        { "letter": "C", "text": "O lazer, a segurança, a previdência social." },
        { "letter": "D", "text": "A proteção à maternidade e à infância." },
        { "letter": "E", "text": "Todas as alternativas anteriores estão corretas." }
      ],
      "gabarito": "E",
      "imagens_enunciado": null
    },
    {
      "id": 2,
      "materia": "Português",
      "assunto": "Interpretação de Texto",
      "enunciado": "Analise o texto a seguir e responda...",
      "parsedAlternativas": [
        { "letter": "A", "text": "Alternativa A" },
        { "letter": "B", "text": "Alternativa B" },
        { "letter": "C", "text": "Alternativa C" },
        { "letter": "D", "text": "Alternativa D" },
        { "letter": "E", "text": "Alternativa E" }
      ],
      "gabarito": "B",
      "imagens_enunciado": "https://example.com/imagem1.jpg"
    }
  ]
}
```

### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `simuladoName` | string | Sim | Nome do simulado (aparece na capa) |
| `preparatorioName` | string | Não | Nome do preparatório/curso (se informado, substitui simuladoName na capa) |
| `studentName` | string | Sim | Nome do aluno (aparece na capa, pode ser vazio para campo em branco) |
| `cargo` | string | Não | Cargo/área do concurso |
| `totalTime` | number | Sim | Tempo total em **minutos** (ex: 180 = 3 horas) |
| `provaNumber` | number | Sim | Número da prova (0 = Prova 1, 1 = Prova 2, etc.) |
| `questions` | array | Sim | Lista de questões (ver estrutura abaixo) |

### Estrutura de Questão

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | number | Sim | ID único da questão |
| `materia` | string | Sim | Matéria/disciplina (usado para agrupar questões) |
| `assunto` | string | Não | Assunto específico |
| `enunciado` | string | Sim | Texto do enunciado (pode conter HTML simples) |
| `parsedAlternativas` | array | Sim | Lista de alternativas |
| `gabarito` | string | Sim | Letra da resposta correta (A, B, C, D ou E) |
| `imagens_enunciado` | string \| null | Não | URL(s) de imagens, separadas por vírgula ou ponto-e-vírgula |

### Estrutura de Alternativa

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `letter` | string | Sim | Letra da alternativa (A, B, C, D ou E) |
| `text` | string | Sim | Texto da alternativa |

---

## Response

### Sucesso (200)

Retorna o arquivo PDF diretamente como `application/pdf`.

**Headers de resposta:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="NomeDoSimulado_Prova_1.pdf"
```

### Erro (400/500)

```json
{
  "success": false,
  "error": "Mensagem de erro descritiva"
}
```

---

## Exemplo de Integração

### JavaScript/TypeScript (Node.js)

```javascript
async function generatePDF(data) {
  const response = await fetch('https://questoes.appcodigodavida.com.br/api/pdf/simulado', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao gerar PDF');
  }

  // Retorna o buffer do PDF
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Uso
const pdfBuffer = await generatePDF({
  simuladoName: 'Simulado INSS',
  studentName: 'Maria Santos',
  totalTime: 120,
  provaNumber: 0,
  questions: [/* ... */]
});

// Salvar arquivo
fs.writeFileSync('simulado.pdf', pdfBuffer);
```

### JavaScript (Browser)

```javascript
async function downloadPDF(data) {
  const response = await fetch('https://questoes.appcodigodavida.com.br/api/pdf/simulado', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Erro ao gerar PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.simuladoName}_Prova_${data.provaNumber + 1}.pdf`;
  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
```

### Python

```python
import requests

def generate_pdf(data):
    response = requests.post(
        'https://questoes.appcodigodavida.com.br/api/pdf/simulado',
        json=data,
        headers={'Content-Type': 'application/json'}
    )

    if response.status_code != 200:
        raise Exception(f"Erro: {response.json().get('error', 'Erro desconhecido')}")

    return response.content

# Uso
pdf_data = {
    "simuladoName": "Simulado INSS",
    "studentName": "Maria Santos",
    "totalTime": 120,
    "provaNumber": 0,
    "questions": [
        {
            "id": 1,
            "materia": "Português",
            "assunto": "Gramática",
            "enunciado": "Qual a classe gramatical da palavra destacada?",
            "parsedAlternativas": [
                {"letter": "A", "text": "Substantivo"},
                {"letter": "B", "text": "Adjetivo"},
                {"letter": "C", "text": "Verbo"},
                {"letter": "D", "text": "Advérbio"},
                {"letter": "E", "text": "Pronome"}
            ],
            "gabarito": "B",
            "imagens_enunciado": None
        }
    ]
}

pdf_bytes = generate_pdf(pdf_data)
with open('simulado.pdf', 'wb') as f:
    f.write(pdf_bytes)
```

### PHP

```php
<?php
function generatePDF($data) {
    $ch = curl_init('https://questoes.appcodigodavida.com.br/api/pdf/simulado');

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        $error = json_decode($response, true);
        throw new Exception($error['error'] ?? 'Erro ao gerar PDF');
    }

    return $response;
}

// Uso
$data = [
    'simuladoName' => 'Simulado INSS',
    'studentName' => 'Maria Santos',
    'totalTime' => 120,
    'provaNumber' => 0,
    'questions' => [/* ... */]
];

$pdf = generatePDF($data);
file_put_contents('simulado.pdf', $pdf);
```

### cURL

```bash
curl -X POST https://questoes.appcodigodavida.com.br/api/pdf/simulado \
  -H "Content-Type: application/json" \
  -d '{
    "simuladoName": "Simulado INSS",
    "studentName": "Maria Santos",
    "totalTime": 120,
    "provaNumber": 0,
    "questions": [
      {
        "id": 1,
        "materia": "Português",
        "assunto": "Gramática",
        "enunciado": "Qual a classe gramatical?",
        "parsedAlternativas": [
          {"letter": "A", "text": "Substantivo"},
          {"letter": "B", "text": "Adjetivo"},
          {"letter": "C", "text": "Verbo"},
          {"letter": "D", "text": "Advérbio"},
          {"letter": "E", "text": "Pronome"}
        ],
        "gabarito": "B",
        "imagens_enunciado": null
      }
    ]
  }' \
  --output simulado.pdf
```

---

## Estrutura do PDF Gerado

O PDF é composto por 3 partes:

### 1. Capa (1 página)
- Logo Ouse Passar
- Nome do simulado/preparatório
- Número da prova
- Cards informativos (quantidade de questões, duração, data)
- Frase motivacional aleatória
- Campo para nome do aluno
- Instruções

### 2. Questões (múltiplas páginas)
- Layout em 2 colunas
- Questões agrupadas por matéria
- Cabeçalho de matéria destacado
- Suporte a imagens nas questões
- Texto justificado com hifenização

### 3. Folha de Respostas (1 página)
- Campos para nome, data e nota
- Grade de respostas em 4 colunas
- Círculos para marcar alternativas (A-E)

---

## Limites e Recomendações

| Item | Limite/Recomendação |
|------|---------------------|
| Questões por PDF | Recomendado até 100 questões |
| Tamanho do enunciado | Sem limite, mas textos muito longos podem afetar layout |
| Imagens | URLs públicas e acessíveis (HTTP/HTTPS) |
| Timeout | 60 segundos para geração |
| Tamanho máximo do body | 50MB |

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Parâmetros inválidos ou faltando |
| 500 | Erro interno na geração do PDF |
| 504 | Timeout na geração (PDF muito grande) |

---

## Customização

Para customizar o visual do PDF (cores, logo, layout), é necessário modificar o arquivo fonte:

```
packages/mastra/src/services/pdfService.ts
```

Principais pontos de customização:
- **Logo**: Linha 91 - URL da imagem
- **Cores**: CSS inline (procure por `#1a1a2e` e `#16213e`)
- **Frases motivacionais**: Array `MOTIVATIONAL_QUOTES` (linhas 4-15)
- **Layout**: Funções `generateCoverPageHTML`, `generateQuestionsHTML`, `generateAnswerSheetHTML`

---

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
