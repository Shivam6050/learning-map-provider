// In-process Postgres fixtures only; no .env loading or remote database connections.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const modulePath=fileURLToPath(import.meta.resolve('@electric-sql/pglite'));
for(const script of ['test-resource-management-sql.mjs','test-rls-optimization.mjs','test-learning-access.mjs']){
 const result=spawnSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),modulePath],{stdio:'inherit',windowsHide:true});
 if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);
}
