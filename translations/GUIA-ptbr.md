# Ultima VII: The Black Gate — guia de tradução PT-BR

Você traduz textos do USECODE (roteiros de diálogo, livros, placas, falas flutuantes) do inglês para o **português do Brasil**. O texto volta para o bytecode original; por isso as regras técnicas abaixo são OBRIGATÓRIAS.

## Regras técnicas (obrigatórias)

1. **Conjunto de caracteres**: apenas ASCII imprimível mais estas letras: `á à â ã é ê í ó ô õ ú ç Á À Â Ã É Ê Í Ó Ô Õ Ú Ç`. NADA de aspas curvas (“ ” ‘ ’), travessão (— –), reticências de um caractere (…), «», ¡ ¿, ü, ñ. Use `"` e `'` retos, `-` e `...`.
2. **Marcadores** devem ser preservados exatamente na mesma quantidade e na mesma posição relativa:
   - `@...@` = fala flutuante sobre a cabeça. Mantenha os `@` no início/fim.
   - `*` = pausa/quebra de página (esperar clique). Mantenha cada `*`, inclusive no fim.
   - `~` (e `~~`) = quebra de linha/parágrafo. Mantenha a mesma quantidade.
   - `|` = separador (em lápides/placas). Mantenha.
   - Tabulações, `\r`, `\n` originais: mantenha.
3. **Fragmentos**: muitos textos são pedaços concatenados em tempo de execução com nomes, números ou outras partes (ex.: `"Hello, ` + nome do jogador + `. How art thou?"`). PRESERVE espaços no início e no fim e a pontuação de borda (aspas abertas/fechadas, vírgulas, ponto). Se o original começa com espaço, a tradução começa com espaço; se termina com espaço, termina com espaço. Se o original abre aspas e não fecha, a tradução também abre e não fecha. Leia os fragmentos vizinhos (estão na ordem do arquivo) para que a frase montada faça sentido em português.
4. Strings vazias, só pontuação, ou só nomes próprios: devolva igual ao original.
5. **Palavras-chave de conversa** (respostas clicáveis como `name`, `job`, `bye`): o jogo compara o texto escolhido com outras strings por igualdade exata. Por isso existe um GLOSSÁRIO FIXO de palavras-chave (`glossary.json`): toda string cujo texto inglês INTEIRO aparece no glossário DEVE receber exatamente a tradução do glossário (maiúsculas e minúsculas incluídas). O validador confere isso.
6. Palavras-chave têm limite de **29 bytes** (o motor corta respostas maiores). Duas palavras-chave inglesas diferentes não podem virar o mesmo texto português.

## Estilo

### Registro arcaico (OBRIGATÓRIO — pedido do dono do projeto)
O original usa inglês arcaico (thee/thou/thy/thine, art/hast/dost/wouldst/canst, "'tis", "methinks", "mine husband"). Preserve essa pegada antiga em português:
- `thou/thee/thy/thine` → **tu / te / ti / contigo / teu / tua / teus / tuas**, com o verbo na 2ª pessoa do singular correta: "Thou art" → "Tu és"/"És"; "Hast thou" → "Tens"; "Dost thou know" → "Sabes"; "Wouldst thou" → "Gostarias"/"Querias"; "Canst thou" → "Podes"; "thou shalt" → "hás de"/"irás"; imperativos de tu ("Vai!", "Toma!", "Escuta!", "Dize-me", "Segue-me"). Pronomes oblíquos e mesóclise com moderação ("Dir-te-ei" é aceitável em falas solenes; no geral prefira "Eu te direi").
- `ye` (plural) → **vós** com conjugação correta ("Vós sois", "Ide!").
- Quando o próprio inglês usa o "you" moderno (narração: "You see...", "You and Spark stare..."; ou personagens que falam "you"), use **você** e conjugação de 3ª pessoa. Não misture tu e você na mesma fala.
- Vocabulário com sabor antigo, sem exagero e sem ficar ilegível: "deveras", "decerto", "mui", "porventura", "outrossim" (raro), "vossa mercê" (só para tratamento muito formal), "saudações", "bom dia te dê", "'Tis" → "É"/"Eis", "methinks" → "parece-me"/"creio eu", "aye" → "sim"/"pois sim", "nay" → "não", "prithee" → "rogo-te"/"por favor", "forsooth" → "em verdade", "alas" → "ai de mim". Lord British e nobres falam de modo solene; camponeses, piratas e crianças podem ser mais simples, mas ainda usam tu.

### Gênero do Avatar e concordância (OBRIGATÓRIO)
O jogador pode ser homem ou mulher. O jogo escolhe sozinho algumas palavras (milord/milady, lad/lass, he/she, him/her, his/her, sir/madam) inserindo fragmentos diferentes; fora disso, o texto é o mesmo para os dois.
- Em toda frase fixa dirigida ao Avatar ou sobre o Avatar, NÃO use adjetivos/particípios marcados por gênero (cansado/a, bem-vindo/a, pronto/a, seguro/a, sozinho/a, obrigado/a, perdido/a...). Reescreva de forma neutra. Exemplos: "Welcome!" → "Que bom te receber!"; "Art thou ready?" → "Podemos partir?"; "Thou art a great hero" → "Tua bravura é lendária"; "Thou art tired" → "O cansaço te domina". Substantivos que não dependem do gênero do Avatar ("tua coragem", "tua pessoa", "tua presença") resolvem a maioria dos casos. Vocativos como "my friend" dirigidos ao Avatar: omita o vocativo ou use "Avatar"/o nome do jogador quando natural.
- Termos fixos do universo que são títulos não variam: "o Avatar" é sempre masculino gramatical como título (como "a vítima" é sempre feminino); "o Avatar está cansado" é aceitável quando a frase fala do título "Avatar", mas prefira o neutro quando fácil.
- Fragmentos he/she/him/her/his inseridos pelo código: adapte AS DUAS versões e as frases vizinhas para que ambas funcionem. Lembre que o possessivo em português concorda com a coisa possuída: "his book"/"her book" → "seu livro" nos dois casos. "him"/"her" objeto → "o"/"a" ("Mostra-lhe" funciona para ambos!). Prefira formas invariáveis (lhe, seu/sua conforme o objeto, "essa pessoa").
- milord → milorde; milady → milady; m'lord → milorde; lad → rapaz; lass → moça; sir → senhor; madam → senhora.

### Outras regras de estilo
- Sotaques e falas estropiadas (gárgulas falam "To be ..." / "Am I ..."; bêbados; gagos; piratas) devem ser recriados em português com efeito semelhante. Gárgulas: use infinitivos e construções truncadas ("Ser bom te ver", "Querer comprar?").
- Rimas, enigmas e trocadilhos: adapte para funcionar em português, mantendo o sentido no jogo (respostas de enigmas que o jogo verifica são palavras-chave do glossário).
- Números escritos por extenso podem ser traduzidos. Valores numéricos concatenados não aparecem nas strings.
- Moeda: `gold` → `ouro` (`gold coins` → `moedas de ouro`); `gp`/`gold pieces` → `peças de ouro`.
- Nomes de pessoas: mantenha em inglês (Iolo, Shamino, Dupre, Spark, Batlin, Hook, Elizabeth, Abraham, Lord British...).
- Cidades de uma palavra: mantenha (Britain, Trinsic, Minoc, Yew, Vesper, Moonglow, Jhelom, Paws, Cove, Skara Brae, Buccaneer's Den -> ver glossário).
- Termos do universo (use sempre):
  - Britannia; the Avatar → o Avatar; Fellowship → Irmandade; The Guardian → o Guardião; Black Gate → Portal Negro; Moongate(s) → Portal(is) Lunar(es); Time Lord → Senhor do Tempo; Orb of the Moons → Orbe das Luas.
  - Virtudes: Honesty Honestidade, Compassion Compaixão, Valor Valor, Justice Justiça, Sacrifice Sacrifício, Honor Honra, Spirituality Espiritualidade, Humility Humildade; Truth Verdade, Love Amor, Courage Coragem.
  - Triad of Inner Strength → Tríade da Força Interior; Strive For Unity → Busque a Unidade; Trust Thy Brother → Confia em Teu Irmão; Worthiness Precedes Reward → O Mérito Precede a Recompensa; Inner Voice → Voz Interior; Book of Fellowship → Livro da Irmandade.
  - gargoyle → gárgula; wingless gargoyle → gárgula sem asas; Emps → Emps; Liche → Liche; wisp(s) → fogo(s)-fátuo(s); reagents → reagentes; blackrock → rocha negra; Caddellite → Caddellite; Silver Serpent venom → peçonha de serpente prateada.
  - Great Council → Grande Conselho; Britannian Tax Council → Conselho Tributário Britânico; Mayor → Prefeito; Lord/Lady (títulos) → Lorde/Lady; Sir → Sir.
- Exemplo de registro: `"Hello, ` → `"Saudações, `; `"Thou art a true friend."` → `"Tu és um amigo verdadeiro."`; `"Hast thou seen him?"` → `"Tu o viste?"`; `"I must be going."*` → `"Preciso ir."*`.

## Saída

Um único objeto JSON UTF-8 `{"CHAVE": "tradução", ...}` contendo TODAS as chaves da entrada, sem nenhuma outra chave. Valide com `python engine/check-translation.py` e corrija até passar.
