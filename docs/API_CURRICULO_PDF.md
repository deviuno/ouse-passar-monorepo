# API de Geração de Currículo PDF - Pesca Talentos

Documentação para integração com o sistema de geração de PDF de currículos profissionais.

---

## Endpoints

| Endpoint | Tipo | Descrição |
|----------|------|-----------|
| `POST /api/pdf/curriculo/simples` | Simples | PDF apenas texto, preto e branco, ideal para envio por email |
| `POST /api/pdf/curriculo/completo` | Completo | PDF com foto, layout profissional colorido em blocos |

**Base URL:** `https://questoes.appcodigodavida.com.br`

---

## Autenticação

Atualmente os endpoints não requerem autenticação.

---

## Request

### Headers

```
Content-Type: application/json
```

### Body (JSON)

```json
{
  "candidateName": "Maria Oliveira Santos",
  "title": "Analista de Sistemas Senior",
  "email": "maria.santos@email.com",
  "phone": "38998765432",
  "location": "Belo Horizonte, MG",
  "neighborhood": "Savassi",
  "birthDate": "1990-03-15",
  "gender": "Feminino",
  "maritalStatus": "Casada",
  "summary": "Profissional com mais de 8 anos de experiencia em desenvolvimento de sistemas.",
  "avatarUrl": "https://exemplo.com/foto.jpg",
  "educationLevel": "Pos-Graduacao Completa",
  "yearsOfExperience": 8,
  "expectedSalary": 1200000,
  "minimumSalary": 1000000,
  "immediateAvailability": true,
  "hasDisability": false,
  "disabilityDescription": null,
  "contractTypes": ["CLT", "PJ"],
  "skills": ["Java", "Spring Boot", "React", "TypeScript", "AWS"],
  "education": [
    {
      "level": "Pos-Graduacao Completa",
      "area": "Engenharia de Software",
      "institution": "PUC Minas",
      "startDate": "2018-02-01",
      "endDate": "2019-12-01",
      "inProgress": false
    }
  ],
  "experiences": [
    {
      "position": "Tech Lead",
      "company": "Empresa XYZ",
      "sector": "Tecnologia",
      "startDate": "2021-01-01",
      "endDate": null,
      "currentJob": true,
      "description": "Lideranca de equipe de 8 desenvolvedores."
    }
  ],
  "courses": [
    {
      "name": "AWS Solutions Architect",
      "institution": "Amazon Web Services",
      "description": "Certificacao em arquitetura de solucoes na nuvem AWS"
    }
  ],
  "languages": [
    {
      "name": "Ingles",
      "level": "Avancado"
    },
    {
      "name": "Espanhol",
      "level": "Intermediario"
    }
  ]
}
```

---

## Parâmetros

### Campos Principais

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `candidateName` | string | **Sim** | Nome completo do candidato |
| `title` | string | Não | Título profissional |
| `email` | string | Não | E-mail de contato |
| `phone` | string | Não | Telefone de contato |
| `location` | string | Não | Cidade/Estado |
| `neighborhood` | string | Não | Bairro |
| `birthDate` | string | Não | Data de nascimento (YYYY-MM-DD) |
| `gender` | string | Não | Gênero |
| `maritalStatus` | string | Não | Estado civil |
| `summary` | string | Não | Resumo profissional |
| `avatarUrl` | string | Não | URL da foto (apenas no PDF completo) |
| `educationLevel` | string | Não | Nível de escolaridade |
| `yearsOfExperience` | number | Não | Anos de experiência |
| `expectedSalary` | number | Não | Pretensão salarial máxima (em centavos) |
| `minimumSalary` | number | Não | Pretensão salarial mínima (em centavos) |
| `immediateAvailability` | boolean | Não | Disponibilidade imediata |
| `hasDisability` | boolean | Não | Possui deficiência (PCD) |
| `disabilityDescription` | string | Não | Descrição da deficiência |
| `contractTypes` | string[] | Não | Tipos de contrato aceitos (CLT, PJ, etc.) |
| `skills` | string[] | Não | Lista de habilidades |
| `education` | array | Não | Lista de formações acadêmicas |
| `experiences` | array | Não | Lista de experiências profissionais |
| `courses` | array | Não | Lista de cursos e certificações |
| `languages` | array | Não | Lista de idiomas |

### Estrutura de Experiência

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `position` | string | Sim | Cargo ocupado |
| `company` | string | Sim | Nome da empresa |
| `sector` | string | Não | Setor de atuação |
| `startDate` | string | Não | Data de início (YYYY-MM-DD) |
| `endDate` | string | Não | Data de término (YYYY-MM-DD) |
| `currentJob` | boolean | Não | Emprego atual |
| `description` | string | Não | Descrição das atividades |

### Estrutura de Educação

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `level` | string | Sim | Nível (Graduação, Pós-Graduação, etc.) |
| `area` | string | Não | Área de formação |
| `institution` | string | Sim | Instituição de ensino |
| `startDate` | string | Não | Data de início |
| `endDate` | string | Não | Data de término |
| `inProgress` | boolean | Não | Cursando atualmente |

### Estrutura de Curso

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | Sim | Nome do curso |
| `institution` | string | Sim | Instituição |
| `description` | string | Não | Descrição adicional |

### Estrutura de Idioma

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | Sim | Nome do idioma |
| `level` | string | Sim | Nível de proficiência |

---

## Response

### Sucesso (200)

Retorna o arquivo PDF diretamente como `application/pdf`.

**Headers de resposta:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Curriculo_Simples_Maria_Oliveira_Santos.pdf"
```

### Erro (400)

```json
{
  "success": false,
  "error": "O campo candidateName e obrigatorio"
}
```

### Erro (500)

```json
{
  "success": false,
  "error": "Erro ao gerar PDF: [detalhes do erro]"
}
```

---

## Comparativo dos Tipos de PDF

| Característica | PDF Simples | PDF Completo |
|----------------|-------------|--------------|
| Foto do candidato | Não | Sim |
| Layout | Texto corrido | Em blocos/colunas |
| Cores | Apenas preto e cinza | Colorido com gradientes |
| Fonte | Times New Roman (serif) | Inter/Segoe UI (sans-serif) |
| Tamanho ideal | Envio por email | Impressão profissional |
| Badges (PCD, Disponível) | Texto simples | Badges coloridos |
| Ícones | Não | Sim |

---

## Exemplos de Integração

### cURL - PDF Simples

```bash
curl -X POST https://questoes.appcodigodavida.com.br/api/pdf/curriculo/simples \
  -H "Content-Type: application/json" \
  -d '{
    "candidateName": "Joao da Silva",
    "title": "Desenvolvedor Full Stack",
    "email": "joao@email.com",
    "phone": "38999999999",
    "location": "Montes Claros, MG",
    "summary": "Profissional com 5 anos de experiencia em desenvolvimento web.",
    "skills": ["JavaScript", "React", "Node.js"]
  }' \
  --output curriculo_simples.pdf
```

### cURL - PDF Completo

```bash
curl -X POST https://questoes.appcodigodavida.com.br/api/pdf/curriculo/completo \
  -H "Content-Type: application/json" \
  -d '{
    "candidateName": "Joao da Silva",
    "title": "Desenvolvedor Full Stack",
    "email": "joao@email.com",
    "phone": "38999999999",
    "location": "Montes Claros, MG",
    "summary": "Profissional com 5 anos de experiencia em desenvolvimento web.",
    "avatarUrl": "https://exemplo.com/foto.jpg",
    "educationLevel": "Graduacao Completa",
    "yearsOfExperience": 5,
    "immediateAvailability": true,
    "skills": ["JavaScript", "React", "Node.js"],
    "education": [
      {
        "level": "Graduacao Completa",
        "area": "Ciencia da Computacao",
        "institution": "Universidade Estadual"
      }
    ],
    "experiences": [
      {
        "position": "Desenvolvedor Senior",
        "company": "Tech Solutions",
        "currentJob": true,
        "description": "Desenvolvimento de aplicacoes web"
      }
    ]
  }' \
  --output curriculo_completo.pdf
```

### JavaScript (Browser)

```javascript
async function downloadCurriculumPDF(data, type = 'completo') {
  const response = await fetch(
    `https://questoes.appcodigodavida.com.br/api/pdf/curriculo/${type}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao gerar PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `Curriculo_${type}_${data.candidateName.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Uso
downloadCurriculumPDF({
  candidateName: 'João Silva',
  email: 'joao@email.com',
  skills: ['JavaScript', 'React']
}, 'simples');
```

### JavaScript/TypeScript (Node.js)

```javascript
async function generateCurriculumPDF(data, type = 'completo') {
  const response = await fetch(
    `https://questoes.appcodigodavida.com.br/api/pdf/curriculo/${type}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao gerar PDF');
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Uso
const fs = require('fs');

const pdfBuffer = await generateCurriculumPDF({
  candidateName: 'Maria Santos',
  title: 'Analista de Dados',
  email: 'maria@email.com',
  skills: ['Python', 'SQL', 'Power BI']
}, 'completo');

fs.writeFileSync('curriculo.pdf', pdfBuffer);
```

### Python

```python
import requests

def generate_curriculum_pdf(data, pdf_type='completo'):
    response = requests.post(
        f'https://questoes.appcodigodavida.com.br/api/pdf/curriculo/{pdf_type}',
        json=data,
        headers={'Content-Type': 'application/json'}
    )

    if response.status_code != 200:
        error = response.json()
        raise Exception(error.get('error', 'Erro desconhecido'))

    return response.content

# Uso
pdf_data = {
    "candidateName": "Maria Santos",
    "title": "Desenvolvedora Backend",
    "email": "maria@email.com",
    "phone": "11999998888",
    "location": "Rio de Janeiro, RJ",
    "summary": "Desenvolvedora com experiencia em Python e APIs REST.",
    "experiences": [
        {
            "position": "Desenvolvedora Python",
            "company": "Tech Company",
            "currentJob": True,
            "description": "Desenvolvimento de APIs e microservicos"
        }
    ],
    "skills": ["Python", "Django", "FastAPI", "PostgreSQL"],
    "languages": [
        {"name": "Portugues", "level": "Nativo"},
        {"name": "Ingles", "level": "Avancado"}
    ]
}

# Gerar PDF simples
pdf_simples = generate_curriculum_pdf(pdf_data, 'simples')
with open('curriculo_simples.pdf', 'wb') as f:
    f.write(pdf_simples)

# Gerar PDF completo
pdf_completo = generate_curriculum_pdf(pdf_data, 'completo')
with open('curriculo_completo.pdf', 'wb') as f:
    f.write(pdf_completo)

print("PDFs gerados com sucesso!")
```

### PHP

```php
<?php

function generateCurriculumPDF($data, $type = 'completo') {
    $ch = curl_init("https://questoes.appcodigodavida.com.br/api/pdf/curriculo/{$type}");

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
    'candidateName' => 'João Silva',
    'title' => 'Desenvolvedor PHP',
    'email' => 'joao@email.com',
    'experiences' => [
        [
            'position' => 'Desenvolvedor Senior',
            'company' => 'Empresa XYZ',
            'currentJob' => true,
            'description' => 'Desenvolvimento de sistemas web em PHP/Laravel'
        ]
    ],
    'skills' => ['PHP', 'Laravel', 'MySQL', 'JavaScript', 'Vue.js']
];

// PDF Simples
$pdfSimples = generateCurriculumPDF($data, 'simples');
file_put_contents('curriculo_simples.pdf', $pdfSimples);

// PDF Completo
$pdfCompleto = generateCurriculumPDF($data, 'completo');
file_put_contents('curriculo_completo.pdf', $pdfCompleto);

echo "PDFs gerados com sucesso!";
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Campo obrigatório faltando (`candidateName`) |
| 500 | Erro interno na geração do PDF |
| 504 | Timeout na geração (dados muito grandes) |

---

## Limites e Recomendações

| Item | Limite/Recomendação |
|------|---------------------|
| Experiências | Recomendado até 10 itens |
| Formações | Recomendado até 5 itens |
| Habilidades | Recomendado até 15 itens |
| Idiomas | Recomendado até 5 itens |
| Cursos | Recomendado até 10 itens |
| Tamanho do resumo | Até 500 caracteres |
| Tamanho das descrições | Até 300 caracteres por item |
| Timeout | 30 segundos |
| Tamanho máximo do body | 50MB |

---

## Notas sobre Salário

Os campos `expectedSalary` e `minimumSalary` devem ser enviados **em centavos** (multiplicar o valor por 100):

| Valor Real | Valor a Enviar |
|------------|----------------|
| R$ 5.000,00 | 500000 |
| R$ 10.000,00 | 1000000 |
| R$ 12.500,00 | 1250000 |

---

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
