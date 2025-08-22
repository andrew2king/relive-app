// In-memory data store for development without database
interface User {
  id: string;
  email: string;
  username?: string;
  password: string;
  credits: number;
  membershipLevel: string;
  membershipExpiry?: Date;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

class MemoryStore {
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, string> = new Map(); // email -> userId
  private usersByUsername: Map<string, string> = new Map(); // username -> userId
  private creditTransactions: Map<string, CreditTransaction> = new Map();

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // Check if user exists
    if (this.usersByEmail.has(userData.email.toLowerCase())) {
      throw new Error('用户已存在');
    }
    if (userData.username && this.usersByUsername.has(userData.username)) {
      throw new Error('用户名已存在');
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      ...userData,
      id,
      email: userData.email.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, user);
    this.usersByEmail.set(user.email, id);
    if (user.username) {
      this.usersByUsername.set(user.username, id);
    }

    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const userId = this.usersByEmail.get(email.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Credit transaction operations
  async createCreditTransaction(transactionData: Omit<CreditTransaction, 'id' | 'createdAt'>): Promise<CreditTransaction> {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction: CreditTransaction = {
      ...transactionData,
      id,
      createdAt: new Date(),
    };

    this.creditTransactions.set(id, transaction);
    return transaction;
  }

  async getCreditTransactionsByUserId(userId: string): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    return true;
  }

  // Clear data (for testing)
  async clear(): Promise<void> {
    this.users.clear();
    this.usersByEmail.clear();
    this.usersByUsername.clear();
    this.creditTransactions.clear();
  }

  // Get stats
  getStats() {
    return {
      users: this.users.size,
      transactions: this.creditTransactions.size,
    };
  }
}

// Singleton instance
let memoryStore: MemoryStore | null = null;

export function getMemoryStore(): MemoryStore {
  if (!memoryStore) {
    memoryStore = new MemoryStore();
  }
  return memoryStore;
}

export { MemoryStore, User, CreditTransaction };