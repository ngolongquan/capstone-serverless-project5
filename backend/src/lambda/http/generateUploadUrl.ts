import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors} from 'middy/middlewares'
import { generateUploadUrl } from '../../businessLogic/tasks'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {    
    // TODO: Return a presigned URL to upload a file for a TASK item with the provided id
    const theSignedUrl = await generateUploadUrl(event);
    console.log('theSignedUrl:' + theSignedUrl )
      return {
        statusCode: 202,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          uploadUrl: theSignedUrl
        })
      };
      }
)

handler  
  .use(
    cors({
      credentials: true
    })
  )
