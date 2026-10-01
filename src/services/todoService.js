import { config, tablesDB } from "./appwriteConfig"
import { ID } from "react-native-appwrite";



export const getTodos = async() => {
try {
const response = await
tablesDB.listRows({
databaseId: config.db,
tableId: config.table.todos
})
return response
} catch (error) {
throw(error)
}
}

export const addTodo = async (title) => {
try {
const newTodo = await tablesDB.createRow({
databaseId: config.db,
tableId: config.table.todos,
rowId: ID.unique(),
data: { title, completed: false }
})
return newTodo
} catch (error) {
throw error
}
}

export const toggleTodo = async (id, completed) => {
try {
const updatedTodo = await
tablesDB.updateRow({
databaseId: config.db,
tableId: config.table.todos,
rowId: id,
data: { completed: !completed }
})
return updatedTodo
} catch (error) {
throw error
}
}

export const removeTodo = async (id) => {
try {
await tablesDB.deleteRow({
databaseId: config.db,
tableId: config.table.todos,
rowId: id
})
} catch (error) {
throw error
}
}