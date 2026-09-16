'use server'

import { createSessionClient, createAdminClient } from '@/utils/appwrite/server'
import { ID, Query } from 'node-appwrite'
import { revalidatePath } from 'next/cache'
import { getMovieDetails } from '@/utils/tmdb'

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

export async function createList(title: string, description: string = '', isPublic: boolean = true) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const list = await tables.createRow(DB_ID, 'custom_lists', ID.unique(), {
      user_id: user.$id,
      title,
      description,
      is_public: isPublic,
      created_at: new Date().toISOString()
    })

    revalidatePath('/lists')
    return { success: true, data: JSON.parse(JSON.stringify(list)) }
  } catch (error: any) {
    console.error('Error creating list:', error)
    return { success: false, error: error.message }
  }
}

export async function getMyLists() {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const result = await tables.listRows(DB_ID, 'custom_lists', [
      Query.equal('user_id', user.$id),
      Query.orderDesc('created_at')
    ])

    return { success: true, data: JSON.parse(JSON.stringify(result.rows)) }
  } catch (error: any) {
    console.error('Error fetching lists:', error)
    return { success: false, data: [] }
  }
}

export async function getListDetails(listId: string) {
  try {
    const { tables } = await createAdminClient()

    const list = await tables.getRow(DB_ID, 'custom_lists', listId)
    
    const itemsResult = await tables.listRows(DB_ID, 'list_items', [
      Query.equal('list_id', listId),
      Query.orderDesc('added_at')
    ])

    const movies = await Promise.all(
      itemsResult.rows.map(async (row: any) => {
        try {
          const tmdbData = await getMovieDetails(row.tmdb_id)
          return {
            ...tmdbData,
            item_id: row.$id,
            added_at: row.added_at
          }
        } catch (e) {
          return null
        }
      })
    )

    return { 
      success: true, 
      data: { 
        list: JSON.parse(JSON.stringify(list)), 
        items: movies.filter(Boolean) 
      } 
    }
  } catch (error: any) {
    console.error('Error fetching list details:', error)
    return { success: false, error: error.message }
  }
}

export async function addToList(listId: string, tmdbId: number) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    
    await account.get()

    await tables.createRow(DB_ID, 'list_items', ID.unique(), {
      list_id: listId,
      tmdb_id: tmdbId,
      added_at: new Date().toISOString()
    })

    revalidatePath(`/title/${tmdbId}`)
    revalidatePath(`/lists/${listId}`)
    return { success: true }
  } catch (error: any) {
    if (error.code === 409) return { success: true }
    console.error('Error adding to list:', error)
    return { success: false, error: error.message }
  }
}

export async function removeFromList(listId: string, tmdbId: number) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    
    await account.get()

    const result = await tables.listRows(DB_ID, 'list_items', [
      Query.equal('list_id', listId),
      Query.equal('tmdb_id', tmdbId)
    ])

    if (result.total > 0) {
      await tables.deleteRow(DB_ID, 'list_items', result.rows[0].$id)
    }

    revalidatePath(`/title/${tmdbId}`)
    revalidatePath(`/lists/${listId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error removing from list:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteList(listId: string) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    await account.get()

    await tables.deleteRow(DB_ID, 'custom_lists', listId)

    let offset = 0
    let hasMore = true
    while (hasMore) {
      const items = await tables.listRows(DB_ID, 'list_items', [
        Query.equal('list_id', listId),
        Query.limit(100)
      ])
      
      for (const item of items.rows) {
        await tables.deleteRow(DB_ID, 'list_items', item.$id)
      }

      if (items.rows.length < 100) {
        hasMore = false
      }
    }

    revalidatePath('/lists')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting list:', error)
    return { success: false, error: error.message }
  }
}

export async function getListsContainingMovie(tmdbId: number) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const userLists = await tables.listRows(DB_ID, 'custom_lists', [
      Query.equal('user_id', user.$id)
    ])
    
    if (userLists.total === 0) return { success: true, data: [] }

    const listIds = userLists.rows.map(l => l.$id)

    const items = await tables.listRows(DB_ID, 'list_items', [
      Query.equal('tmdb_id', tmdbId),
      Query.limit(100)
    ])

    const activeListIds = items.rows
      .filter((item: any) => listIds.includes(item.list_id))
      .map((item: any) => item.list_id)

    return { success: true, data: activeListIds }
  } catch (error: any) {
    console.error('Error getting lists for movie:', error)
    return { success: false, data: [] }
  }
}
