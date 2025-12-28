/**
 * SpeedExecutor - Executes batches of tasks with concurrency and delay limits
 * 
 * Enforces speed limits during validation by:
 * - Limiting concurrent task execution to configured concurrency
 * - Applying delay between task completions
 * 
 * Requirements: 3.2, 3.3
 */
export class SpeedExecutor {
    /**
     * Create a new SpeedExecutor
     * 
     * @param {number} concurrency - Maximum concurrent tasks (1-50)
     * @param {number} delay - Delay in ms between task completions (100-10000)
     */
    constructor(concurrency, delay) {
        this.concurrency = concurrency;
        this.delay = delay;
        this.cancelled = false;
        this.stats = {
            totalTasks: 0,
            completedTasks: 0,
            startTime: null,
            currentConcurrency: 0
        };
    }

    /**
     * Execute a batch of tasks with speed limits
     * 
     * Requirement 3.2: Limits concurrent validations to tier's concurrency limit
     * Requirement 3.3: Enforces tier's delay between validations
     * 
     * @param {Array<Function>} tasks - Array of async task functions
     * @param {Function} onProgress - Optional progress callback (completed, total)
     * @param {Function} onResult - Optional result callback (result, index) - called as each task completes
     * @returns {Promise<Array>} Array of task results
     */
    async executeBatch(tasks, onProgress, onResult) {
        if (!Array.isArray(tasks) || tasks.length === 0) {
            return [];
        }

        this.stats.totalTasks = tasks.length;
        this.stats.completedTasks = 0;
        this.stats.startTime = new Date();
        this.cancelled = false;

        const results = [];
        const queue = [...tasks];
        const executing = new Set();

        while (queue.length > 0 || executing.size > 0) {
            if (this.cancelled) {
                throw new Error('Execution cancelled');
            }

            // Fill up to concurrency limit
            while (queue.length > 0 && executing.size < this.concurrency) {
                const task = queue.shift();
                const taskIndex = this.stats.totalTasks - queue.length - executing.size - 1;

                const promise = this._executeTask(task, taskIndex, results, onProgress, onResult);
                executing.add(promise);

                promise.finally(() => {
                    executing.delete(promise);
                });
            }

            this.stats.currentConcurrency = executing.size;

            // Log when concurrency limit is reached (for monitoring)
            if (executing.size === this.concurrency && queue.length > 0) {
                // Concurrency limit reached, tasks are queued
                // This is expected behavior, not a violation
            }

            // Wait for at least one task to complete before continuing
            if (executing.size > 0) {
                await Promise.race(executing);
            }
        }

        return results;
    }

    /**
     * Execute a single task with delay enforcement
     * 
     * @private
     * @param {Function} task - Async task function
     * @param {number} index - Task index for result ordering
     * @param {Array} results - Results array to populate
     * @param {Function} onProgress - Progress callback
     * @param {Function} onResult - Result callback (called immediately when task completes)
     * @returns {Promise<void>}
     */
    async _executeTask(task, index, results, onProgress, onResult) {
        let taskResult;
        try {
            const result = await task();
            taskResult = { success: true, result };
            results[index] = taskResult;
        } catch (error) {
            taskResult = { success: false, error: error.message };
            results[index] = taskResult;
        }

        this.stats.completedTasks++;

        // Skip callbacks if cancelled (FE disconnected)
        if (this.cancelled) {
            return;
        }

        // Call result callback immediately (for live streaming)
        if (onResult) {
            try {
                onResult(taskResult, index);
            } catch (err) {
                // Logging disabled
            }
        }

        if (onProgress) {
            onProgress(this.stats.completedTasks, this.stats.totalTasks);
        }

        // Apply delay between task completions (Requirement 3.3)
        if (this.delay > 0 && this.stats.completedTasks < this.stats.totalTasks) {
            await new Promise(resolve => setTimeout(resolve, this.delay));
        }
    }

    /**
     * Get current execution statistics
     * 
     * @returns {Object} Execution stats with estimated completion time
     */
    getStats() {
        if (!this.stats.startTime) {
            return {
                ...this.stats,
                estimatedCompletion: null,
                elapsedMs: 0,
                tasksPerSecond: 0
            };
        }

        const elapsedMs = Date.now() - this.stats.startTime.getTime();
        const completedTasks = this.stats.completedTasks;

        // Calculate rate (tasks per second)
        const tasksPerSecond = elapsedMs > 0 ? (completedTasks / (elapsedMs / 1000)) : 0;

        // Estimate remaining time
        const remainingTasks = this.stats.totalTasks - completedTasks;
        let estimatedCompletion = null;

        if (tasksPerSecond > 0 && remainingTasks > 0) {
            const remainingMs = (remainingTasks / tasksPerSecond) * 1000;
            estimatedCompletion = new Date(Date.now() + remainingMs);
        } else if (remainingTasks === 0) {
            estimatedCompletion = new Date();
        }

        return {
            totalTasks: this.stats.totalTasks,
            completedTasks: this.stats.completedTasks,
            startTime: this.stats.startTime,
            currentConcurrency: this.stats.currentConcurrency,
            estimatedCompletion,
            elapsedMs,
            tasksPerSecond: Math.round(tasksPerSecond * 100) / 100
        };
    }

    /**
     * Cancel batch execution
     * 
     * Sets cancelled flag which will cause executeBatch to throw on next iteration
     */
    cancel() {
        this.cancelled = true;
    }

    /**
     * Check if execution has been cancelled
     * 
     * @returns {boolean} True if cancelled
     */
    isCancelled() {
        return this.cancelled;
    }
}

export default SpeedExecutor;
