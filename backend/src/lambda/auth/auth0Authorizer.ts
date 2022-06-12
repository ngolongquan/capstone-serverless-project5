import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
// import * as jwksClient from 'jwks-rsa'
import { verify} from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
// import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'
import Axios from 'axios';

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-4q4deydk.us.auth0.com/.well-known/jwks.json'
// const client = jwksClient({
//   jwksUri: jwksUrl
// });
export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader);
  // const jwt: Jwt = decode(token, { complete: true }) as Jwt

  let certif;
  try {
    const res = await Axios.get(jwksUrl);
    const pemData = res['data']['keys'][0]['x5c'][0];
    certif = `-----BEGIN CERTIFICATE-----\n${pemData}\n-----END CERTIFICATE-----`;
  } catch (err) {
    console.log(err);
  }

  return verify(token, certif, { algorithms: ['RS256']}) as JwtPayload;
}

// async function verifyToken(authHeader: string): Promise<JwtPayload> {
//   const token = getToken(authHeader)
//   const jwt: Jwt = decode(token, { complete: true }) as Jwt

//   // TODO: Implement token verification
//   // You should implement it similarly to how it was implemented for the exercise for the lesson 5
//   // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

//   if(!jwt || !jwt.header) {
//     throw new Error("Invalid jwt header")
//   }

//   let key = await getKey(jwt.header)
//   let publicKey = key.getPublicKey()
//   return verify(token,publicKey) as JwtPayload  
// }

// async function getKey(header: JwtHeader): Promise<jwksClient.SigningKey>{
//   return new Promise((resolve,reject) => {
//     client.getSigningKey(header.kid, function(err: Error, key: jwksClient.SigningKey) {
//         if(err){
//           reject(err)
//         }
//         resolve(key)        
//     });
//   })

// }

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
