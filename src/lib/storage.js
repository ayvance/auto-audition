import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Mutex } from 'async-mutex';

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

// Mutexes for file locking
const questionsMutex = new Mutex();
const submissionsMutex = new Mutex();
const usersMutex = new Mutex();
const termsMutex = new Mutex();

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
    return questionsMutex.runExclusive(async () => {
        return readJson(QUESTIONS_FILE, []);
    });
}

export async function saveQuestions(questions) {
    return questionsMutex.runExclusive(async () => {
        return writeJson(QUESTIONS_FILE, questions);
    });
}

// Submissions API
export async function getSubmissions() {
    return submissionsMutex.runExclusive(async () => {
        return readJson(SUBMISSIONS_FILE, []);
    });
}

export async function saveSubmission(submission) {
    return submissionsMutex.runExclusive(async () => {
        const submissions = await readJson(SUBMISSIONS_FILE, []);
        const newSubmission = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            status: 'unreviewed', // Default status
            ...submission,
        };
        submissions.push(newSubmission);
        await writeJson(SUBMISSIONS_FILE, submissions);
        return newSubmission;
    });
}

export async function getSubmissionById(id) {
    return submissionsMutex.runExclusive(async () => {
        const submissions = await readJson(SUBMISSIONS_FILE, []);
        return submissions.find(s => s.id === id);
    });
}

export async function updateSubmission(id, updates) {
    return submissionsMutex.runExclusive(async () => {
        const submissions = await readJson(SUBMISSIONS_FILE, []);
        const index = submissions.findIndex(s => s.id === id);
        if (index !== -1) {
            submissions[index] = { ...submissions[index], ...updates };
            await writeJson(SUBMISSIONS_FILE, submissions);
            return submissions[index];
        }
        return null;
    });
}

export async function deleteSubmission(id) {
    return submissionsMutex.runExclusive(async () => {
        let submissions = await readJson(SUBMISSIONS_FILE, []);
        const initialLength = submissions.length;
        submissions = submissions.filter(s => s.id !== id);
        if (submissions.length !== initialLength) {
            await writeJson(SUBMISSIONS_FILE, submissions);
            return true;
        }
        return false;
    });
}

// Users API
export async function getUsers() {
    return usersMutex.runExclusive(async () => {
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
    });
}

export async function verifyUser(email, password) {
    // getUsers uses the mutex, so we are safe.
    // Wait, verifyUser calls getUsers which locks. That's fine.
    // However, if we want to be atomic, we should lock here too if we were modifying things.
    // For read-only, it's fine as long as we don't hold the lock for too long.
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
    return usersMutex.runExclusive(async () => {
        const users = await readJson(USERS_FILE, []);
        const index = users.findIndex(u => u.email === email);
        if (index === -1) return false;

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = crypto.createHash('sha256').update(newPassword + salt).digest('hex');

        users[index] = { ...users[index], passwordHash, salt };
        await writeJson(USERS_FILE, users);
        return true;
    });
}

// Terms API
export async function getTerms() {
    return termsMutex.runExclusive(async () => {
        return readJson(TERMS_FILE, DEFAULT_TERMS);
    });
}

export async function saveTerms(terms) {
    return termsMutex.runExclusive(async () => {
        return writeJson(TERMS_FILE, terms);
    });
}
