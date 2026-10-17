// Vercel Function: stores .u7save files in Vercel Blob under a recovery code.
// Enabled when a Blob store is connected to the project (BLOB_READ_WRITE_TOKEN).
import {put,get} from '@vercel/blob';
import {handleSaveRequest} from '../lib/save-codes.js';

const access=process.env.U7_BLOB_ACCESS==='public'?'public':'private';
const pathname=code=>`saves/${code}.u7save`;
const store={
 enabled:Boolean(process.env.BLOB_READ_WRITE_TOKEN),
 async read(code){
  try{const result=await get(pathname(code),{access,useCache:false});return result?.statusCode===200?result.stream:null;}
  catch(error){if(error?.name==='BlobNotFoundError')return null;throw error;}
 },
 async write(code,bytes){
  await put(pathname(code),Buffer.from(bytes),{access,addRandomSuffix:false,allowOverwrite:true,contentType:'application/octet-stream',cacheControlMaxAge:60});
 },
};
export function GET(request){return handleSaveRequest(request,store);}
export function POST(request){return handleSaveRequest(request,store);}
