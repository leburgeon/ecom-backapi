import cron from 'node-cron'
import TempOrder from '../models/TempOrder'
import { createSessionAndReleaseStock } from './helpers'

// A task for cleaning up expired tempOrders that executes every 5 minutes
export const tempOrderCleanupTask = cron.schedule('*/5 * * * *', async () => {
  try {
     // Collects all the tempOrders that have expired
    const expiredTempOrders = await TempOrder.find({
      expiresAt: {$lte: Date.now()}
    })

    // Each tempOrder is released within a session that also updates the stock of the products
    const releasePromises = expiredTempOrders.map(async (tempOrder) => {
      return createSessionAndReleaseStock(tempOrder)
    })

    // DANGER: Blocking! Consider switching to a task queue for each?
    const results = await Promise.allSettled(releasePromises)
    let released = 0
    let failed = 0

    results.forEach(result => {
      if (result.status === 'fulfilled'){
        released += 1
      } else {
        failed += 1
      }
    })

    console.log('##############Complete###################')
    console.log(`Released: ${released} failed: ${failed}`)
  } catch (error){
    console.error(error)
  }
  
}, {scheduled: false})