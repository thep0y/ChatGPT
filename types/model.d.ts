/*
 * author   thepoy
 * file     model.d.ts
 * created  2023-04-21 16:49:14
 * modified 2023-04-21 16:49:14
 */

type u64 = number
type bool = boolean

interface Permission {
  id: string
  object: string
  created: u64
  allow_create_engine: bool
  allow_sampling: bool
  allow_logprobs: bool
  allow_search_indices: bool
  allow_view: bool
  allow_fine_tuning: bool
  organization: string
  group: string | null
  is_blocking: bool
}

interface Model {
  id: string
  object: string
  created: u64
  owned_by: string
  permission: Permission[]
  root: string
  parent: string | null
}
