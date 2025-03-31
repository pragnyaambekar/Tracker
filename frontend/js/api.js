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