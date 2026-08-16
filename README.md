# VibeTube v3.8 Release Candidate

Foco: estabilização, testes, sincronização bidirecional e preparação para release.

### Entregue
- testes unitários de resolução de conflitos
- teste instrumental de inicialização
- CI GitHub Actions para `test` e `assembleDebug`
- sincronização com `deviceId`, `updatedAt` e `version`
- política de conflito explícita
- cache/offline mantido
- downloads Media3 mantidos e preparados para retomada
- R8/minificação no release
- template de keystore fora do código
- `.gitignore` para segredos/keystores
- checklist de Release Candidate

### Assinatura
O Android exige que APKs distribuíveis sejam assinados. O projeto inclui apenas `keystore.properties.example`; a chave privada e senhas não são incluídas. A documentação do Android recomenda manter as informações de assinatura fora dos arquivos de build compartilhados. citeturn0search0turn0search3

### Media3
A linha está fixada em Media3 1.10.1, que é a versão estável indicada atualmente; 1.11.0-rc01 está disponível como release candidate. citeturn0search5

### Validação
Não foi possível declarar o RC como “compilado e aprovado” apenas gerando o código-fonte: a validação final deve rodar no ambiente Gradle/Android SDK com o wrapper e SDK instalados. O CI incluído executa os testes e o build debug automaticamente quando o projeto é colocado em um repositório.

### Próximo estágio
Depois que o RC passar pelo build real, a v3.9 pode ser a primeira release estável: assinatura real, AAB, testes em dispositivos, observabilidade e publicação.
