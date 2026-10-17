# Ultima VII Web

[English](../../README.md) · **Português do Brasil** · [Español](README.es.md)

*Ultima VII: The Black Gate* com *Forge of Virtue*, rodando no navegador com o motor original compilado para WebAssembly. Abra a página e jogue: não há nada para instalar, nenhum emulador e nenhum arquivo para enviar.

**Jogar:** <https://ultimavii.vercel.app>

O foco do projeto é rodar bem o jogo on-line. Ele abre rápido, roda liso no computador e no celular, fica nítido nas telas atuais e nunca perde o seu progresso. As traduções vêm desse mesmo trabalho: com um motor limpo e portável, fica fácil acrescentar novos idiomas.

## Conteúdo

- [Desempenho](#desempenho)
- [Imagem e som](#imagem-e-som)
- [Jogos salvos](#jogos-salvos)
- [Controles](#controles)
- [Idiomas](#idiomas)
- [Privacidade e segurança](#privacidade-e-segurança)
- [Executar e compilar](#executar-e-compilar)
- [Organização do projeto](#organização-do-projeto)
- [Como contribuir](#como-contribuir)
- [Agradecimentos e referências](#agradecimentos-e-referências)
- [Licenças](#licenças)
- [Aviso legal](#aviso-legal)

## Desempenho

- **Motor nativo, sem emulação.** O código C/C++ de [Kitrinx/Ultima7_Decomp](https://github.com/Kitrinx/Ultima7_Decomp) é compilado com Emscripten. O jogo roda num módulo WebAssembly de 4 MB, e não dentro de um emulador de DOS.
- **Um único download verificado.** Os 193 recursos do jogo vêm num pacote de 17,4 MiB, conferido com SHA-256 e guardado no cache do navegador. A partir da segunda visita, o jogo abre direto do cache.
- **Cache de longa duração.** O motor, os retratos e as imagens do inventário têm endereços com a versão e são entregues como imutáveis. Uma versão nova baixa só o que mudou.
- **Imagens prontas antes da hora.**
  - As figuras e os botões do inventário são baixados e decodificados enquanto o jogo carrega, então o primeiro inventário já abre completo. As figuras foram reduzidas ao maior tamanho que a tela chega a mostrar: 1 MB no total, antes 4,5 MB.
  - Os retratos do Avatar e do grupo são baixados no início. Os demais seguem o Avatar: o motor informa a posição do Avatar e a página baixa os retratos de quem mora ou trabalha por perto, segundo as rotinas de cada personagem.
- **Pouca memória.**
  - A música toca por streaming num único elemento de áudio.
  - Os efeitos são decodificados sob demanda num cache pequeno.
  - O motor começa com 64 MB de memória.
- **Celulares.** Controles por toque, tela deitada e jogo em janela inteira. O cabeçalho da página some durante a partida.

## Imagem e som

- **Opções de vídeo do Exult**, com o próprio código do Exult compilado no motor:
  - 14 filtros de ampliação: Point, Interlaced, Bilinear, BilinearPlus, 2xSaI, SuperEagle, Super2xSaI, Scale2x, Hq2x/3x/4x e 2xBR/3xBR/4xBR.
  - Escala do filtro e ajuste final.
  - Ajustar, centralizar ou esticar.
  - 8:5 ou 4:3.
  - Gama por canal.
  - Escurecimentos graduais no jogo e cor da borda.
- **Texto em alta resolução.**
  - Conversas, livros e pergaminhos são desenhados pelo navegador na resolução da tela, mas cada fala e cada resposta continuam decididas pela lógica do jogo.
  - As placas mantêm as runas, com a transcrição em letras latinas logo abaixo.
- **Inventário em alta resolução.**
  - O painel de cada personagem foi repintado no estilo dos retratos.
  - As linhas dos encaixes apontam para o corpo.
  - Os botões foram redesenhados.
  - Itens, bolsas abertas e o cursor continuam por cima, e a noite escurece o painel como o resto do mundo.
- **Retratos redesenhados** de todos os personagens.
- **Som.**
  - Música: síntese OPL original, gravações do Roland MT-32 por Simon Quinn ou o remix de JD Harding.
  - Efeitos: OPL, o pacote SoundBlaster de Joseph Morris ou o pacote MT-32 de Simon Quinn.

Padrões: música de JD Harding, efeitos SoundBlaster, volume em 60%, filtro Point em 8:5 e retrato automático do Avatar.

## Jogos salvos

- **Continuar jornada** retoma o último salvamento. **Carregar jogo** lista todas as partidas salvas e abre qualquer uma delas.
- O progresso fica no navegador e não depende da versão do site; atualizações nunca o apagam.
- **Para levar o progresso para outro navegador ou aparelho:**
  - **Baixar progresso (.u7save)** gera um arquivo com todas as partidas, em todos os idiomas; **Abrir arquivo .u7save** restaura esse arquivo.
  - Um **código de recuperação**, como `ABCD-EFGH-JKMN`, guarda o mesmo arquivo no servidor; digite o código no outro aparelho. A partir daí, cada salvamento atualiza o mesmo código.
- O menu de salvar dentro do jogo (`S`) tem dez espaços com nome, salvar e carregar, download do arquivo, códigos de recuperação e importação de outro navegador.

## Controles

| Ação | Mouse e teclado | Toque |
|---|---|---|
| Andar | Segure o botão direito | Toque e segure (o Avatar segue o dedo) |
| Conversar, usar, abrir | Clique duplo | Dois toques |
| Mover um item | Arraste | Arraste |
| Inventário | `I` | Botão Inventário |
| Menu de salvar | `S` | Botão Salvar |

As respostas e o **Continuar** são botões no painel de leitura. Em **Leitura** você escolhe a posição dos diálogos, a fonte, o tamanho e o contraste. **Conversas** mostra o histórico desta sessão.

## Idiomas

Cada idioma guarda suas próprias partidas. Escolha o idioma no cabeçalho da página ou abra `?lang=<código>`.

| Idioma | Código | Situação | Origem |
|---|---|---|---|
| English | `en` | Jogável | Jogo original |
| Português do Brasil | `pt-BR` | Jogável | Este projeto |
| Español | `es` | Jogável | Importado da Final V1 de L@Zar0 / Clan DLAN |
| Italiano | `it` | Planejado | — |
| Русский | `ru` | Planejado | — |

Sobre as versões em português e em espanhol:

- **Português do Brasil.** A campanha inteira está traduzida:
  - 21.182 strings em todas as 1.012 funções do roteiro, mais os nomes de objetos e as mensagens do motor.
  - Os botões do menu, as legendas da introdução, os créditos, os rótulos dos painéis e os avisos do cursor foram redesenhados com as fontes do próprio jogo.
  - O registro é arcaico (*tu/vós*), e cada frase funciona tanto para um Avatar homem quanto para uma Avatar mulher.
- **Espanhol.** 21.476 strings são importadas da tradução de fãs. O bytecode do jogo é mantido byte a byte; só as referências de strings e o cache de dependências são reconstruídos.

Como acrescentar um idioma, inclusive as fontes cirílicas para o russo, está descrito em [docs/ADDING_A_LANGUAGE.md](../ADDING_A_LANGUAGE.md). Os idiomas são registrados em `dist/languages.js`.

## Privacidade e segurança

- **Sem rastreamento.** Não há contas, cookies, análises de uso nem requisições a terceiros: todos os arquivos vêm do próprio site.
- **Suas partidas ficam com você.**
  - As partidas salvas ficam guardadas no armazenamento do seu navegador.
  - Nada é enviado, a menos que você gere um código de recuperação. Nesse caso, o servidor guarda só aquele arquivo de salvamento, sob um código aleatório de 60 bits. Nenhum nome, e-mail ou outro dado pessoal é pedido ou guardado.
  - Quem tiver o código pode ler e substituir esse salvamento, então não o compartilhe.
- **Cabeçalhos rígidos.**
  - Content-Security-Policy sem scripts embutidos e sem origens externas.
  - HSTS, proibição de enquadramento, `nosniff`, política de referência restrita, e uma Permissions-Policy que desliga câmera, microfone, localização, pagamento e recursos parecidos.
- **Entrada não confiável tem limites.**
  - Arquivos e códigos de salvamento têm o tamanho conferido e são descompactados com teto.
  - Os caminhos dentro de um salvamento são validados.
  - O servidor só aceita backups verdadeiros.
  - A transferência de progresso do endereço antigo só aceita aquela origem e aquela janela exatas, e pergunta antes de importar.

Informe vulnerabilidades em particular, como descrito em [SECURITY.md](../../SECURITY.md).

## Executar e compilar

Este repositório traz o código, as ferramentas e a arte nova, mas **nenhum dado original do jogo**.

**Para rodar por conta própria:**
1. Tenha uma cópia do jogo (por exemplo, *Ultima 7 Complete* na [GOG](https://www.gog.com/en/game/ultima_7_complete)).
2. Empacote a pasta `STATIC/` com `node engine/package-game.mjs <caminho>/STATIC`.
3. Execute `npm start` e abra `http://127.0.0.1:8077`. O servidor local entrega só `dist/`, como o site hospedado.

**Requisitos:**
- Node.js 22 ou superior.
- Git, Python 3, CMake e **Emscripten 6.0.12** para compilar o motor.

**Compilar o motor:**

```bash
bash engine/build.sh    # baixa o Ultima7_Decomp no commit 770e21a, aplica a camada do navegador e grava dist/engine/
```

**Gerar os arquivos traduzidos** (com `U7_GAME_DIR` apontando para a pasta que contém `STATIC/`):

```bash
python engine/build_translation.py   # USECODE a partir de translation-overrides.json
python engine/build_linkdep.py       # LINKDEP1/LINKDEP2
python engine/patch_textflx.py       # TEXT.FLX
python engine/build_menu.py          # botões do menu, introdução, créditos
python engine/build_gumps.py         # rótulos dos painéis e silhuetas do inventário
python engine/build_pointers.py      # avisos do cursor
python engine/check-translation.py   # marcadores, caracteres, palavras-chave
```

**Pacotes de áudio.** Baixe os pacotes de Black Gate na [página de downloads do Exult](https://exult.sourceforge.io/download.html) e execute `python engine/package-audio.py <pacote-exult>.zip <remix-jd-harding>.zip`.

**Verificações:**

```bash
npm run release && npm run check                  # carimbo da versão e conferência dos arquivos (também rodados pela hospedagem)
U7_SMOKE_MODE=save node engine/verify-flow.cjs    # joga a abertura, salva e restaura
```

**Códigos de recuperação.** Os códigos precisam de um [Vercel Blob](https://vercel.com/docs/vercel-blob) conectado ao projeto (`BLOB_READ_WRITE_TOKEN`). Sem ele, os arquivos de salvamento continuam funcionando e a página avisa que os códigos estão desligados. Localmente, os códigos ficam em `.local/saves`.

## Organização do projeto

| Caminho | Conteúdo |
|---|---|
| `dist/` | O site: página, estilos, scripts, fontes, retratos, arte do inventário |
| `dist/languages.js` | Registro de idiomas |
| `api/save.js`, `lib/save-codes.js` | Função dos códigos de recuperação |
| `engine/` | Camada do navegador para o motor (`browser.c`, `prepare.py`, `CMakeLists.txt`), filtros do Exult, scripts de compilação e de teste |
| `engine/build_*.py` | Ferramentas que geram os arquivos traduzidos do jogo |
| `translation-overrides.json` | Catálogo do roteiro em português (`FUNÇÃO:índice` → texto) |
| `translations/` | Glossário, guia de estilo, catálogo e licença do espanhol, tabelas dos painéis e do cursor |
| `docs/` | Como acrescentar um idioma; este README em outros idiomas |

## Como contribuir

Relatos de problemas, correções, testes de jogo e novos idiomas são bem-vindos; veja [CONTRIBUTING.md](../../CONTRIBUTING.md). Nos relatos de tradução, informe a chave `FUNÇÃO:índice` do catálogo, se souber.

## Agradecimentos e referências

**Motor e ferramentas**
- [Kitrinx/Ultima7_Decomp](https://github.com/Kitrinx/Ultima7_Decomp): o motor descompilado sobre o qual esta versão é construída.
- [Exult](https://github.com/exult/exult): os filtros de imagem, a tabela de opcodes do usecode e décadas de conhecimento sobre os formatos dos arquivos.
- [Nuked OPL3](https://github.com/nukeykt/Nuked-OPL3), de Nuke.YKT: síntese AdLib.

**Música e som** (pacotes distribuídos pelo [Exult](https://exult.sourceforge.io/download.html))
- Simon Quinn: música e efeitos do Roland MT-32 em gravação digital.
- Joseph Morris: efeitos SoundBlaster.
- JD Harding: o remix da trilha.

**Fontes**
- [Source Serif 4](https://github.com/adobe-fonts/source-serif) e [Inter](https://github.com/rsms/inter), sob a SIL Open Font License.

**Traduções de Ultima VII**

Estas são as traduções que conhecemos. Elas são as referências para os próximos idiomas do projeto. Nenhum arquivo delas está incluído, exceto o da tradução espanhola, usada sob a licença GPL. Há mais detalhes na [lista de traduções do Ultima Codex](https://wiki.ultimacodex.com/wiki/Translations_of_Ultima_VII).

- **Espanhol:**
  - *Final V1* (2017), de **L@Zar0 / Clan DLAN**, cobrindo *The Black Gate* e *Forge of Virtue*. Importada neste projeto, sob GPL-3.0; créditos em `translations/LEEME-es.txt`. Também serviu de referência de sentido para o português.
  - Uma tradução de fãs anterior, com *Forge of Virtue*, do **grupo de Dantoine**.
- **Italiano:**
  - *Il Portale Oscuro* e *La Forgia della Virtù* (2009), do **Babylon Team** da OldGamesItalia, coordenada por **The Ancient One**, com revisão final de **Ragfox**.
  - Texto, gráficos e vozes, para o Exult.
  - Veja a [página no Ultima Codex](https://wiki.ultimacodex.com/wiki/Ultima_VII_in_Italiano).
- **Russo:**
  - Uma tradução de fãs de **Sleepy Emp & Quester** para o Exult, listada na [PCGamingWiki](https://www.pcgamingwiki.com/wiki/Ultima_VII:_The_Black_Gate).
  - Reunida com outros mods na [discussão de traduções do Exult](https://github.com/exult/exult/discussions/260).
- **Alemão:**
  - O lançamento oficial alemão da Origin (só em disquetes).
  - O patch de fãs [*Ultima VII auf Deutsch*](https://wiki.ultimacodex.com/wiki/Ultima_VII_auf_Deutsch), de **Sir John**, que cobre *Forge of Virtue*, os gráficos e as vozes.

Se você fez uma dessas traduções ou conhece outra, abra uma *issue*. Teremos prazer em corrigir ou acrescentar o crédito, e pediremos permissão antes de importar qualquer coisa.

**A Origin Systems e Richard Garriott** criaram o jogo. Este projeto existe por carinho por ele.

## Licenças

- **Nosso código** (`dist/*.js`, `dist/*.html`, `dist/*.css`, `api/`, `lib/`, os scripts de `engine/` e a camada do navegador): [GPL-3.0-or-later](../../LICENSE).
- **Nossa arte** (retratos redesenhados, figuras e ícones do inventário): [CC BY-SA 4.0](../../LICENSE-ART.md).
- **Partes de terceiros** mantêm suas próprias licenças; veja [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
  - Filtros e tabela de opcodes do Exult: GPL-2.0-or-later.
  - Código novo do Ultima7_Decomp: MIT. O código descompilado do jogo continua sendo propriedade da Electronic Arts; ele é baixado na hora da compilação e não fica guardado aqui.
  - Nuked OPL3: LGPL-2.1.
  - Tradução espanhola: GPL-3.0.
  - Fontes: OFL-1.1.

## Aviso legal

Este é um projeto de fãs sem fins comerciais. Não tem vínculo com a Electronic Arts nem o seu endosso. *Ultima* é marca registrada da Electronic Arts. O jogo, seus dados, textos e arte original pertencem à Electronic Arts e mantêm suas licenças.

Este repositório não contém nenhum arquivo original do jogo. A versão hospedada os fornece para que o jogo rode sem preparação; eles serão removidos a pedido do detentor dos direitos. Se você gosta do jogo, compre-o na [GOG](https://www.gog.com/en/game/ultima_7_complete).
