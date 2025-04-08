// API service for communicating with the backend
class API {
  constructor() {
      this.baseUrl = 'http://localhost:5001/api';
      this.token = localStorage.getItem('token');
  }

  // Helper method for headers
  getHeaders() {
      return {
          'Content-Type': 'application/json',
          'Authorization': this.token ? `Bearer ${this.token}` : ''
      };
  }

  // Auth methods
  async login(username, password) {
      try {
          const response = await fetch(`${this.baseUrl}/auth/login`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ username, password })
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.error || 'Login failed');
          }

          // Save token and user data
          this.token = data.token;
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          console.log("Login successful, user data:", data.user); // Add this for debugging

          return data.user;
      } catch (error) {
          console.error('Login error:', error);
          throw error;
      }
  }

  async register(username, password, timezone) {
      try {
          const response = await fetch(`${this.baseUrl}/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password, timezone })
          });

          const data = await response.json();
          if (!response.ok) {
              throw new Error(data.error || 'Registration failed');
          }

          return data;
      } catch (error) {
          console.error('Registration error:', error);
          throw error;
      }
  }

  logout() {
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
  }

  // Profile methods
  // Profile methods
  async updateProfile(timezone, avatarFile) {
      try {
          // Create FormData to handle file upload
          const formData = new FormData();
          formData.append('timezone', timezone);
          
          if (avatarFile) {
              formData.append('avatar', avatarFile);
          }
          
          console.log('Sending profile update request...', { timezone, hasFile: !!avatarFile });
          
          const response = await fetch(`${this.baseUrl}/users/profile`, {
              method: 'PUT',
              headers: {
                  'Authorization': this.token ? `Bearer ${this.token}` : ''
                  // Note: Don't set Content-Type here, browser will set it with boundary for FormData
              },
              body: formData
          });
          
          // First check if response is OK before trying to parse JSON
          if (!response.ok) {
              console.error('Profile update response not OK:', response.status, response.statusText);
              // Try to get error message from JSON if possible
              let errorMessage = 'Failed to update profile';
              try {
                  const errorData = await response.json();
                  errorMessage = errorData.error || errorMessage;
              } catch (e) {
                  // If response isn't valid JSON, use status text
                  errorMessage = `Server error: ${response.status} ${response.statusText}`;
                  console.error('Error parsing JSON from error response:', e);
              }
              throw new Error(errorMessage);
          }
          
          console.log('Profile update response OK, parsing JSON...');
          
          let data;
          try {
              // Parse JSON response
              data = await response.json();
              console.log('Profile update response data:', data);
          } catch (e) {
              console.error('Error parsing JSON from success response:', e);
              throw new Error('Error parsing server response');
          }
          
          // Update user data in localStorage
          const currentUser = this.getCurrentUser();
          currentUser.timezone = timezone;
          
          if (data.avatarUrl) {
              console.log('Updating avatarUrl in localStorage:', data.avatarUrl);
              currentUser.avatarUrl = data.avatarUrl;
          }
          
          localStorage.setItem('user', JSON.stringify(currentUser));
          
          return data;
      } catch (error) {
          console.error('Update profile error:', error);
          throw error;
      }
  }
  
  async removeAvatar() {
      try {
          const response = await fetch(`${this.baseUrl}/users/remove-avatar`, {
              method: 'POST',
              headers: this.getHeaders()
          });
          
          // Check if response is OK
          if (!response.ok) {
              let errorMessage = 'Failed to remove avatar';
              try {
                  const errorData = await response.json();
                  errorMessage = errorData.error || errorMessage;
              } catch (e) {
                  errorMessage = `Server error: ${response.status} ${response.statusText}`;
              }
              throw new Error(errorMessage);
          }
          
          // Parse response
          const data = await response.json();
          
          // Update user data in localStorage
          const currentUser = this.getCurrentUser();
          currentUser.avatarUrl = null;
          localStorage.setItem('user', JSON.stringify(currentUser));
          
          return data;
      } catch (error) {
          console.error('Remove avatar error:', error);
          throw error;
      }
  }
  
  async changePassword(currentPassword, newPassword) {
      try {
          const response = await fetch(`${this.baseUrl}/users/password`, {
              method: 'PUT',
              headers: this.getHeaders(),
              body: JSON.stringify({ currentPassword, newPassword })
          });
          
          // Check if response is OK before trying to parse JSON
          if (!response.ok) {
              // Try to get error message from JSON if possible
              let errorMessage = 'Failed to change password';
              try {
                  const errorData = await response.json();
                  errorMessage = errorData.error || errorMessage;
              } catch (e) {
                  // If response isn't valid JSON, use status text
                  errorMessage = `Server error: ${response.status} ${response.statusText}`;
              }
              throw new Error(errorMessage);
          }
          
          // Parse JSON response only after we know it's OK
          const data = await response.json();
          return data;
      } catch (error) {
          console.error('Change password error:', error);
          throw error;
      }
  }

  // Streak methods
  async getStreak() {
      try {
          const response = await fetch(`${this.baseUrl}/streaks`, {
              headers: this.getHeaders()
          });

          const data = await response.json();
          if (!response.ok) {
              throw new Error(data.error || 'Failed to get streak data');
          }

          return data;
      } catch (error) {
          console.error('Get streak error:', error);
          throw error;
      }
  }

  async updateStreak() {
      try {
          const response = await fetch(`${this.baseUrl}/streaks/update`, {
              method: 'POST',
              headers: this.getHeaders()
          });

          const data = await response.json();
          if (!response.ok) {
              throw new Error(data.error || 'Failed to update streak');
          }

          return data;
      } catch (error) {
          console.error('Update streak error:', error);
          throw error;
      }
  }

  async resetStreak(userId) {
      try {
          const response = await fetch(`${this.baseUrl}/streaks/reset`, {
              method: 'DELETE',
              headers: this.getHeaders(),
              body: JSON.stringify({ userId })
          });

          const data = await response.json();
          if (!response.ok) {
              throw new Error(data.error || 'Failed to reset streak');
          }

          return data;
      } catch (error) {
          console.error('Reset streak error:', error);
          throw error;
      }
  }

  // Problem methods
  async getProblems() {
      try {
          const response = await fetch(`${this.baseUrl}/problems`, {
              headers: this.getHeaders()
          });

          const data = await response.json();
          if (!response.ok) {
              throw new Error(data.error || 'Failed to get problems');
          }

          return data;
      } catch (error) {
          console.error('Get problems error:', error);
          throw error;
      }
  }

  async toggleProblem(problemId) {
      try {
          const response = await fetch(`${this.baseUrl}/problems/${problemId}/toggle`, {
              method: 'POST',
              headers: this.getHeaders()
          });

          const data = await response.json();
          if (!response.ok) {
              throw new Error(data.error || 'Failed to toggle problem');
          }

          return data;
      } catch (error) {
          console.error('Toggle problem error:', error);
          throw error;
      }
  }

  // Utility methods
  getCurrentUser() {
      try {
          const userStr = localStorage.getItem('user');
          if (!userStr) return null;
          const user = JSON.parse(userStr);
          console.log("Retrieved user:", user); // Debug log
          return user;
      } catch (e) {
          console.error("Error getting current user:", e);
          return null;
      }
  }

  isAuthenticated() {
      return !!this.token;
  }
}

// Create a singleton instance
const api = new API();