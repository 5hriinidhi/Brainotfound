export const cybersecurityTemplates = [

    {
        id: "xss_detection",
        difficulty: "easy",
        generate: () => {

            const input = `<script>alert('hack')</script>`;

            return {
                prompt: `Write a function solve(str) that removes <script> tags from the string: "${input}"`,
                testCases: [
                    {
                        input: [input],
                        output: input.replace(/<script.*?>.*?<\/script>/gi, "")
                    }
                ]
            };
        }
    },

    {
        id: "sql_injection_detect",
        difficulty: "medium",
        generate: () => {

            const query = `SELECT * FROM users WHERE name = 'admin' OR 1=1`;

            return {
                prompt: `Write a function solve(query) that returns true if SQL injection patterns exist in: "${query}"`,
                testCases: [
                    { input: [query], output: true }
                ]
            };
        }
    },

    {
        id: "password_strength",
        difficulty: "hard",
        generate: () => {

            const password = "P@ssw0rd123!";

            return {
                prompt: `Write a function solve(pwd) that returns true if "${password}" contains uppercase, lowercase, number, and special character.`,
                testCases: [
                    { input: [password], output: true }
                ]
            };
        }
    }
];