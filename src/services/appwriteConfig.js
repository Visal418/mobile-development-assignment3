import { Client, TablesDB, ID } from 'react-native-appwrite'
const client = new Client();
client.setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
.setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PACKAGE_NAME)
// init TablesDB
export const tablesDB = new TablesDB(client)
export const DATABASE_ID =
process.env.EXPO_PUBLIC_APPWRITE_DB_ID
export const config = {
db: process.env.EXPO_PUBLIC_APPWRITE_DB_ID,
table: {
todos: process.env.EXPO_PUBLIC_APPWRITE_TABLE_TODOS_ID
}
}
export { ID }