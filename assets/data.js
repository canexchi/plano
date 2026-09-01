/* Plano alimentar prescrito em 04/07/2022.
   Dados transcritos exatamente como na prescrição. */
const MEALS_DATA = [
  {
    id: "cafe",
    name: "CAFÉ DA MANHÃ",
    time: "10:30",
    notes: "Você pode fazer uma vitamina de fruta, neste caso.",
    items: [
      { id: "whey", name: "Whey protein isolado", defaultQty: "0.5 Medidor (15g)", substitutes: [] },
      { id: "fruta_cafe", name: "Fruta", defaultQty: "1 porção (80g)", substitutes: [] },
      { id: "castanha", name: "Castanha de caju", defaultQty: "6 Unidades (15g)", substitutes: [
        { name: "Castanha do Brasil", qty: "2 Unidades (8g)" },
        { name: "Amêndoa", qty: "10 Unidades (10g)" },
        { name: "Semente de chia", qty: "1 Colher de sopa cheia (15g)" },
        { name: "Semente de linhaça", qty: "1 Colher de sopa cheia (15g)" }
      ]},
      { id: "leite", name: "Leite desnatado", defaultQty: "1 Copo americano duplo (240ml)", substitutes: [
        { name: "Iogurte natural", qty: "1 Unidade (200g)" }
      ]}
    ]
  },
  {
    id: "pre_treino",
    name: "PRÉ-TREINO",
    time: "Até 15 min antes",
    notes: "Energia de rápida absorção para o treino.",
    items: [
      { id: "fruta_pre", name: "Fruta", defaultQty: "1 porção (60g)", substitutes: [
        { name: "Suco de laranja", qty: "1 Copo médio (200ml)" }
      ]}
    ]
  },
  {
    id: "almoco",
    name: "ALMOÇO",
    time: "13:30",
    notes: "Deixe pelo menos 1/2 do prato composto por verduras e legumes. Sobremesa: escolha 1 fruta de sua preferência.",
    items: [
      { id: "arroz", name: "Arroz integral", defaultQty: "0 Colher (0g)", substitutes: [
        { name: "Batata inglesa", qty: "2 Colheres de servir (120g)" },
        { name: "Mandioca cozida", qty: "3 Colheres de sopa (90g)" },
        { name: "Mandioquinha", qty: "1 Unidade (118g)" },
        { name: "Inhame", qty: "4 Colheres de sopa (140g)" },
        { name: "Macarrão cozido", qty: "2 Colheres de servir (100g)" }
      ]},
      { id: "feijao", name: "Feijão cozido", defaultQty: "1 Concha cheia (140g)", substitutes: [
        { name: "Lentilha cozida", qty: "1 Concha (85g)" },
        { name: "Grão de bico cozido", qty: "1 Concha (55g)" }
      ]},
      { id: "proteina", name: "Filé de frango grelhado", defaultQty: "120g", substitutes: [
        { name: "Carne bovina magra", qty: "100g" },
        { name: "Filé de peixe", qty: "150g" }
      ]},
      { id: "legumes", name: "Legumes cozidos", defaultQty: "7 Colheres de sopa (105g)", substitutes: [] },
      { id: "salada", name: "Salada de folhas", defaultQty: "1 Prato sobremesa (30g)", substitutes: [] },
      { id: "azeite", name: "Azeite de oliva", defaultQty: "1 Colher de sopa rasa (8g)", substitutes: [] },
      { id: "sobremesa", name: "Fruta", defaultQty: "1 porção (100g)", substitutes: [] }
    ]
  },
  {
    id: "lanche_1",
    name: "LANCHE (OPÇÃO 1)",
    time: "17:30",
    notes: "Você pode fazer uma vitamina de fruta, neste caso.",
    items: [
      { id: "whey_l1", name: "Whey protein isolado", defaultQty: "0.5 Medidor (15g)", substitutes: [] },
      { id: "fruta_l1", name: "Fruta", defaultQty: "1 porção (80g)", substitutes: [] },
      { id: "castanha_l1", name: "Castanha de caju", defaultQty: "6 Unidades (15g)", substitutes: [
        { name: "Castanha do Brasil", qty: "2 Unidades (8g)" },
        { name: "Amêndoa", qty: "10 Unidades (10g)" },
        { name: "Semente de chia", qty: "1 Colher de sopa cheia (15g)" },
        { name: "Semente de linhaça", qty: "1 Colher de sopa cheia (15g)" }
      ]},
      { id: "leite_l1", name: "Leite desnatado", defaultQty: "1 Copo americano duplo (240ml)", substitutes: [
        { name: "Iogurte natural", qty: "1 Unidade (200g)" }
      ]}
    ]
  },
  {
    id: "lanche_2",
    name: "LANCHE (OPÇÃO 2)",
    time: "17:30",
    notes: "Se preferir, faça um patê de frango usando o creme de ricota ou cottage como base.",
    items: [
      { id: "pao", name: "Pão de forma integral", defaultQty: "2 Fatias (50g)", substitutes: [
        { name: "Pão francês", qty: "1 Unidade (50g)" },
        { name: "Goma de tapioca", qty: "3 Colheres de sopa rasas (45g)" }
      ]},
      { id: "frango_desf", name: "Frango desfiado", defaultQty: "4 Colheres de sopa (80g)", substitutes: [
        { name: "Atum em conserva", qty: "5 Colheres de sopa (80g)" }
      ]},
      { id: "suco", name: "Suco natural/integral", defaultQty: "1 Copo médio (200ml)", substitutes: [
        { name: "Fruta", qty: "1 porção (200g)" }
      ]}
    ]
  },
  {
    id: "jantar",
    name: "JANTAR",
    time: "21:00",
    notes: "Deixe pelo menos 1/2 do prato composto por verduras e legumes. Sobremesa: escolha 1 fruta de sua preferência.",
    items: [
      { id: "arroz_jantar", name: "Arroz integral", defaultQty: "6 Colheres sopa (120g)", substitutes: [
        { name: "Batata inglesa", qty: "2 Colheres de servir (120g)" },
        { name: "Mandioca cozida", qty: "3 Colheres de sopa (90g)" },
        { name: "Mandioquinha", qty: "1 Unidade (118g)" },
        { name: "Inhame", qty: "4 Colheres de sopa (140g)" },
        { name: "Macarrão cozido", qty: "2 Colheres de servir (100g)" }
      ]},
      { id: "feijao_jantar", name: "Feijão cozido", defaultQty: "1 Concha cheia (140g)", substitutes: [
        { name: "Grão de bico cozido", qty: "1 Concha (55g)" },
        { name: "Lentilha cozida", qty: "1 Concha (85g)" }
      ]},
      { id: "proteina_jantar", name: "Filé de frango grelhado", defaultQty: "120g", substitutes: [
        { name: "Carne bovina magra", qty: "100g" },
        { name: "Filé de peixe", qty: "150g" }
      ]},
      { id: "legumes_jantar", name: "Legumes cozidos", defaultQty: "7 Colheres de sopa (105g)", substitutes: [] },
      { id: "salada_jantar", name: "Salada de folhas", defaultQty: "1 Prato sobremesa (30g)", substitutes: [] },
      { id: "azeite_jantar", name: "Azeite de oliva", defaultQty: "1 Colher sopa rasa (8g)", substitutes: [] },
      { id: "sobremesa_jantar", name: "Fruta", defaultQty: "1 porção (100g)", substitutes: [] }
    ]
  }
];

/* Abas de refeição. "lanche" resolve para lanche_1 ou lanche_2 conforme a opção ativa.
   O plano é só consulta: não existe marcar refeição como feita. */
const MEAL_TABS = [
  { id: "cafe",       label: "CAFÉ"       },
  { id: "pre_treino", label: "PRÉ-TREINO" },
  { id: "almoco",     label: "ALMOÇO"     },
  { id: "lanche",     label: "LANCHE"     },
  { id: "jantar",     label: "JANTAR"     }
];

const BODY_FIELDS = [
  { id: "weight", label: "Peso",     unit: "kg", step: "0.1", min: 30,  max: 300 },
  { id: "waist",  label: "Cintura",  unit: "cm", step: "0.5", min: 40,  max: 200 },
  { id: "hip",    label: "Quadril",  unit: "cm", step: "0.5", min: 40,  max: 200 },
  { id: "chest",  label: "Tórax",    unit: "cm", step: "0.5", min: 40,  max: 200 },
  { id: "arm",    label: "Braço",    unit: "cm", step: "0.5", min: 15,  max: 80  }
];
