const STORAGE_KEY = "vaultguard.users";

// HARD-CODED ADMIN (cannot be registered)
const DEFAULT_ADMIN = {
  id: 1,
  name: "Admin Officer",
  username: "admin",
  password: "admin@123",
  role: "admin",
};

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadUsers() {
  if (!hasWindow()) return [];
  const data = window.localStorage.getItem(STORAGE_KEY);
  try {
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function mockRegister(name, username, password) {
  const users = loadUsers();

  if (
    users.some((u) => u.username.toLowerCase() === username.toLowerCase()) ||
    username.toLowerCase() === "admin"
  ) {
    throw new Error("Username already exists");
  }

  const newUser = {
    id: Date.now(),
    name,
    username,
    password,
    role: "user",
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function mockLogin(username, password) {
  if (
    username.toLowerCase() === DEFAULT_ADMIN.username.toLowerCase() &&
    password === DEFAULT_ADMIN.password
  ) {
    return DEFAULT_ADMIN;
  }

  const users = loadUsers();
  const match = users.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() &&
      u.password === password
  );

  if (!match) throw new Error("Invalid username or password");
  return match;
}

export function setCurrentUser(user) {
  if (!hasWindow()) return;
  window.localStorage.setItem("vaultguard.currentUser", JSON.stringify(user));
}

export function getCurrentUser() {
  if (!hasWindow()) return null;
  const data = window.localStorage.getItem("vaultguard.currentUser");
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function logoutUser() {
  if (!hasWindow()) return;
  window.localStorage.removeItem("vaultguard.currentUser");
}
