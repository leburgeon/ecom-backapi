import cron from 'node-cron'
import TempOrder from '../models/TempOrder'
import { createSessionAndReleaseStock } from './helpers'

// A task for cleaning up expired tempOrders that executes every 1 minute
export const tempOrderCleanupTask = cron.schedule('*/20 * * * *', async () => {
  console.log('#################################')
  console.log('Temp Order Cleanup Executed')
  try {
     // Collects all the 
    const expiredTempOrders = await TempOrder.find({
      expiresAt: {$lte: Date.now()}
    })

    const releasePromises = expiredTempOrders.map(async (tempOrder) => {
      return createSessionAndReleaseStock(tempOrder)
    })

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