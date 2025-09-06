import { PrismaClient } from '@prisma/client';
import { setTimeout } from 'timers/promises';

const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000; // 1 second

class PrismaClientWithRetry extends PrismaClient {
  private retryCount = 0;

  async $connectWithRetry() {
    while (this.retryCount < MAX_RETRIES) {
      try {
        await this.$connect();
        console.log('✅ Database connected successfully');
        return;
      } catch (error) {
        this.retryCount++;
        const delayMs = INITIAL_DELAY_MS * Math.pow(2, this.retryCount - 1);
        
        console.error(
          `❌ Failed to connect to database (attempt ${this.retryCount}/${MAX_RETRIES}):`,
          error instanceof Error ? error.message : 'Unknown error'
        );

        if (this.retryCount === MAX_RETRIES) {
          console.error('❌ Max retries reached. Could not connect to database.');
          process.exit(1);
        }

        console.log(`⏳ Retrying in ${delayMs / 1000} seconds...`);
        await setTimeout(delayMs);
      }
    }
  }
}

const prisma = new PrismaClientWithRetry();

export default prisma;
