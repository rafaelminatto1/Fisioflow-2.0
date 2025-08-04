# Requirements Document

## Introduction

O sistema de gestão de estoque e equipamentos permitirá que gestores de clínicas de fisioterapia controlem o inventário de materiais, equipamentos e suprimentos necessários para o funcionamento da clínica. O sistema incluirá controle de níveis mínimos, alertas automáticos de reposição, histórico de movimentações e relatórios para tomada de decisão sobre compras e manutenção.

## Requirements

### Requirement 1

**User Story:** Como gestor da clínica, eu quero visualizar todos os itens do estoque em uma interface organizada, para que eu possa ter uma visão geral do inventário disponível.

#### Acceptance Criteria

1. WHEN o gestor acessa a página de estoque THEN o sistema SHALL exibir uma lista de todos os itens cadastrados
2. WHEN a lista é exibida THEN o sistema SHALL mostrar nome, categoria, quantidade atual, quantidade mínima e status para cada item
3. WHEN há muitos itens THEN o sistema SHALL permitir filtrar por categoria, status ou buscar por nome
4. WHEN um item está com estoque baixo THEN o sistema SHALL destacar visualmente o item com cor de alerta

### Requirement 2

**User Story:** Como gestor da clínica, eu quero cadastrar novos itens no estoque com suas informações básicas, para que eu possa controlar todos os materiais e equipamentos da clínica.

#### Acceptance Criteria

1. WHEN o gestor clica em "Adicionar Item" THEN o sistema SHALL abrir um formulário de cadastro
2. WHEN o formulário é preenchido THEN o sistema SHALL validar campos obrigatórios (nome, categoria, quantidade mínima)
3. WHEN o item é salvo THEN o sistema SHALL adicionar o item ao estoque com quantidade inicial zero
4. WHEN o cadastro é concluído THEN o sistema SHALL exibir mensagem de sucesso e atualizar a lista

### Requirement 3

**User Story:** Como gestor da clínica, eu quero definir níveis mínimos de estoque para cada item, para que eu seja alertado quando precisar fazer reposições.

#### Acceptance Criteria

1. WHEN o gestor edita um item THEN o sistema SHALL permitir definir a quantidade mínima
2. WHEN a quantidade atual fica abaixo do mínimo THEN o sistema SHALL marcar o item como "Estoque Baixo"
3. WHEN há itens com estoque baixo THEN o sistema SHALL exibir um contador na navegação
4. WHEN o nível mínimo é alterado THEN o sistema SHALL recalcular automaticamente o status do item

### Requirement 4

**User Story:** Como gestor da clínica, eu quero registrar entradas e saídas de itens do estoque, para que eu possa manter o controle atualizado das quantidades.

#### Acceptance Criteria

1. WHEN o gestor seleciona um item THEN o sistema SHALL permitir registrar entrada ou saída
2. WHEN uma movimentação é registrada THEN o sistema SHALL solicitar quantidade, motivo e observações
3. WHEN a movimentação é salva THEN o sistema SHALL atualizar a quantidade atual do item
4. WHEN há movimentação THEN o sistema SHALL registrar data, usuário responsável e tipo de operação

### Requirement 5

**User Story:** Como gestor da clínica, eu quero receber notificações automáticas quando itens estiverem com estoque baixo, para que eu possa tomar ações de reposição em tempo hábil.

#### Acceptance Criteria

1. WHEN um item atinge o nível mínimo THEN o sistema SHALL criar uma notificação para o gestor
2. WHEN há notificações pendentes THEN o sistema SHALL exibir um badge no ícone de notificações
3. WHEN o gestor visualiza as notificações THEN o sistema SHALL listar todos os itens com estoque baixo
4. WHEN o estoque é reposto acima do mínimo THEN o sistema SHALL remover automaticamente a notificação

### Requirement 6

**User Story:** Como gestor da clínica, eu quero visualizar o histórico de movimentações de cada item, para que eu possa acompanhar o consumo e identificar padrões.

#### Acceptance Criteria

1. WHEN o gestor acessa os detalhes de um item THEN o sistema SHALL exibir histórico de movimentações
2. WHEN o histórico é exibido THEN o sistema SHALL mostrar data, tipo, quantidade, saldo anterior e atual
3. WHEN há muitas movimentações THEN o sistema SHALL permitir filtrar por período ou tipo de movimentação
4. WHEN necessário THEN o sistema SHALL permitir exportar o histórico para análise externa

### Requirement 7

**User Story:** Como gestor da clínica, eu quero categorizar os itens do estoque (equipamentos, materiais de consumo, medicamentos, etc.), para que eu possa organizar melhor o inventário.

#### Acceptance Criteria

1. WHEN o gestor cadastra um item THEN o sistema SHALL permitir selecionar uma categoria
2. WHEN as categorias são exibidas THEN o sistema SHALL incluir: Equipamentos, Materiais de Consumo, Medicamentos, Produtos de Limpeza, Outros
3. WHEN o gestor filtra por categoria THEN o sistema SHALL exibir apenas itens da categoria selecionada
4. WHEN necessário THEN o sistema SHALL permitir ao administrador gerenciar as categorias disponíveis

### Requirement 8

**User Story:** Como gestor da clínica, eu quero gerar relatórios de estoque e movimentações, para que eu possa analisar custos e planejar compras futuras.

#### Acceptance Criteria

1. WHEN o gestor acessa relatórios THEN o sistema SHALL oferecer opções de relatório de estoque atual e movimentações
2. WHEN um relatório é gerado THEN o sistema SHALL permitir filtrar por período, categoria ou status
3. WHEN o relatório é exibido THEN o sistema SHALL mostrar gráficos de consumo e tabelas detalhadas
4. WHEN necessário THEN o sistema SHALL permitir exportar relatórios em PDF ou Excel

### Requirement 9

**User Story:** Como gestor da clínica, eu quero controlar informações específicas de equipamentos (data de compra, garantia, manutenções), para que eu possa gerenciar adequadamente os ativos da clínica.

#### Acceptance Criteria

1. WHEN um item é categorizado como equipamento THEN o sistema SHALL permitir cadastrar informações adicionais
2. WHEN informações de equipamento são cadastradas THEN o sistema SHALL incluir data de compra, valor, fornecedor e prazo de garantia
3. WHEN a garantia está próxima do vencimento THEN o sistema SHALL alertar o gestor
4. WHEN necessário THEN o sistema SHALL permitir registrar histórico de manutenções e reparos

### Requirement 10

**User Story:** Como terapeuta da clínica, eu quero poder visualizar a disponibilidade de materiais e equipamentos, para que eu possa planejar adequadamente os atendimentos.

#### Acceptance Criteria

1. WHEN o terapeuta acessa o sistema THEN o sistema SHALL permitir consultar disponibilidade de itens
2. WHEN um item está indisponível THEN o sistema SHALL informar claramente o status
3. WHEN há itens em falta THEN o sistema SHALL sugerir alternativas quando possível
4. WHEN o terapeuta usa materiais THEN o sistema SHALL permitir registrar o consumo de forma simples