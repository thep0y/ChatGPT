/*
 * author   thepoy
 * file     router.d.ts
 * created  2023-04-21 12:11:55
 * modified 2023-04-21 12:11:55
 */

import 'react-router-dom'

declare module 'react-router-dom' {
  export declare function useParams<
    ParamsOrKey extends string | Record<string, string | undefined> = string,
  > (): { [key in ParamsOrKey]: string }
}
