# Documentação — Play da Tarde

Sistema de gestão do torneio de tênis **Play da Tarde**: grupos, classificação, chaves Ouro/Prata, Rank da temporada e Finals.

| Documento | Para que serve | Quando consultar / atualizar |
|---|---|---|
| [SPEC.md](SPEC.md) | **O que** o sistema faz: regras de negócio, schema, telas | Antes de mudar qualquer regra |
| [DECISOES.md](DECISOES.md) | **Por que** cada regra/escolha técnica foi feita (ADR) | Toda decisão nova ou alterada |
| [ARQUITETURA.md](ARQUITETURA.md) | **Onde** está cada coisa no código e como os dados fluem | Antes de programar |
| [CHANGELOG.md](CHANGELOG.md) | **O que mudou** em cada entrega | A cada entrega |
| [PLANO.md](PLANO.md) | Etapas de implementação, testes manuais e próximos passos | Ao iniciar/validar uma etapa |
| [SETUP.md](SETUP.md) | Instalação do ambiente do zero (Windows) | Máquina nova |
| [dados/](dados/) | CSV da 2ª Etapa e casos de teste reais | Importação e testes |

**Fluxo para qualquer mudança:** SPEC → DECISOES → teste → código → CHANGELOG → commit. Detalhes em [ARQUITETURA.md §4](ARQUITETURA.md#4-como-fazer-uma-mudança-checklist).
