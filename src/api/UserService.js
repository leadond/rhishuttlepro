import { User as UserEntity } from './appEntities';

class UserService {
  // Get all users
  async listUsers() {
    try {
      return await UserEntity.list();
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      return await UserEntity.get(id);
    } catch (error) {
      console.error(`Error getting user ${id}:`, error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      return await UserEntity.create(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id, userData) {
    try {
      return await UserEntity.update(id, userData);
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      return await UserEntity.delete(id);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  // Update user roles
  async updateUserRoles(id, roles) {
    try {
      return await UserEntity.update(id, { roles });
    } catch (error) {
      console.error(`Error updating roles for user ${id}:`, error);
      throw error;
    }
  }

  // Search users
  async searchUsers(query) {
    try {
      return await UserEntity.filter({
        $or: [
          { email: { $icontains: query } },
          { full_name: { $icontains: query } }
        ]
      });
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const userService = new UserService();

// Hook for React components
export const useUserService = () => {
  return userService;
};