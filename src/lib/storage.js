import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TERMS_FILE = path.join(DATA_DIR, 'terms.json');

const DEFAULT_TERMS = {
    title: "利用規約と注意事項",
    content: "ここに利用規約や注意事項を入力してください。\n\n1. 録画された動画は採用選考のみに使用されます。\n2. 静かな環境で受検してください。\n3. ...",
};

// Ensure directories exist
async function ensureDirs() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }

    try {
        await fs.access(UPLOADS_DIR);
    } catch {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    }
}

// Helper to read JSON file
async function readJson(filePath, defaultValue = []) {
    await ensureDirs();
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, write default and return it
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        throw error;
    }
}

// Helper to write JSON file
async function writeJson(filePath, data) {
    await ensureDirs();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Questions API
export async function getQuestions() {
    return readJson(QUESTIONS_FILE, []);
}

export async function saveQuestions(questions) {
    return writeJson(QUESTIONS_FILE, questions);
}

// Submissions API
export async function getSubmissions() {
    return readJson(SUBMISSIONS_FILE, []);
}

export async function saveSubmission(submission) {
    const submissions = await getSubmissions();
    submissions.push({
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'unreviewed', // Default status
        ...submission,
    });
    return writeJson(SUBMISSIONS_FILE, submissions);
}

export async function getSubmissionById(id) {
    const submissions = await getSubmissions();
    return submissions.find(s => s.id === id);
}

export async function updateSubmission(id, updates) {
    const submissions = await getSubmissions();
    const index = submissions.findIndex(s => s.id === id);
    if (index !== -1) {
        submissions[index] = { ...submissions[index], ...updates };
        await writeJson(SUBMISSIONS_FILE, submissions);
        return submissions[index];
    }
    return null;
}

// Users API
import crypto from 'crypto';

export async function getUsers() {
    // Seed default user if not exists
    const users = await readJson(USERS_FILE, []);
    if (users.length === 0) {
        const defaultUser = {
            id: '1',
            email: 'info@virtuacross.com',
            // Simple hash for demo: sha256(password + salt)
            // Default password: 'admin'
            passwordHash: crypto.createHash('sha256').update('admin' + 'somesalt').digest('hex'),
            salt: 'somesalt',
            name: 'Super Admin'
        };
        users.push(defaultUser);
        await writeJson(USERS_FILE, users);
    }
    return users;
}

export async function verifyUser(email, password) {
    const users = await getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return null;

    const hash = crypto.createHash('sha256').update(password + user.salt).digest('hex');
    if (hash === user.passwordHash) {
        const { passwordHash, salt, ...safeUser } = user;
        return safeUser;
    }
    return null;
}

export async function updateUserPassword(email, newPassword) {
    const users = await getUsers();
    const index = users.findIndex(u => u.email === email);
    if (index === -1) return false;

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.createHash('sha256').update(newPassword + salt).digest('hex');

    users[index] = { ...users[index], passwordHash, salt };
    await writeJson(USERS_FILE, users);
    return true;
}

export async function deleteSubmission(id) {
    let submissions = await getSubmissions();
    const initialLength = submissions.length;
    submissions = submissions.filter(s => s.id !== id);
    if (submissions.length !== initialLength) {
        await writeJson(SUBMISSIONS_FILE, submissions);
        return true;
    }
    return false;
}

// Terms API
export async function getTerms() {
    return readJson(TERMS_FILE, DEFAULT_TERMS);
}

export async function saveTerms(terms) {
    return writeJson(TERMS_FILE, terms);
}
