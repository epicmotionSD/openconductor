import winston from 'winston';
import { DatabaseManager } from './connection';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

async function backfillInstallCommands() {
  const db = DatabaseManager.getInstance();

  const beforeResult = await db.query(
    "SELECT COUNT(*) FROM mcp_servers WHERE install_command IS NULL OR install_command = ''"
  );
  const beforeCount = Number.parseInt(beforeResult.rows[0]?.count || '0', 10);

  logger.info(`Servers missing install_command: ${beforeCount}`);

  const updateResult = await db.query(`
    UPDATE mcp_servers
    SET install_command = CASE
      WHEN npm_package IS NOT NULL THEN 'npx -y ' || npm_package
      WHEN pypi_package IS NOT NULL THEN 'uvx ' || pypi_package
      WHEN repository_url IS NOT NULL THEN '# See repository for installation instructions: ' || repository_url
      ELSE '# See repository for installation instructions'
    END
    WHERE install_command IS NULL OR install_command = ''
  `);

  logger.info(`Rows updated: ${updateResult.rowCount ?? 0}`);

  const afterResult = await db.query(
    "SELECT COUNT(*) FROM mcp_servers WHERE install_command IS NULL OR install_command = ''"
  );
  const afterCount = Number.parseInt(afterResult.rows[0]?.count || '0', 10);

  logger.info(`Servers still missing install_command: ${afterCount}`);
}

if (require.main === module) {
  backfillInstallCommands()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Backfill failed:', error);
      process.exit(1);
    });
}
