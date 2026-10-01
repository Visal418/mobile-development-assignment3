import { config, tablesDB } from "./appwriteConfig";
import { ID, Query } from "react-native-appwrite";

// READ: newest items first, so the order is the same after a restart
export const getItems = async () => {
  try {
    const response = await tablesDB.listRows({
      databaseId: config.db,
      tableId: config.table.todos,
      queries: [Query.orderDesc("$createdAt")],
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// CREATE
export const addItem = async (item) => {
  try {
    const newItem = await tablesDB.createRow({
      databaseId: config.db,
      tableId: config.table.todos,
      rowId: ID.unique(),
      data: { item, completed: false },
    });
    return newItem;
  } catch (error) {
    throw error;
  }
};

// UPDATE: toggle bought / not bought
export const toggleItem = async (id, completed) => {
  try {
    const updatedItem = await tablesDB.updateRow({
      databaseId: config.db,
      tableId: config.table.todos,
      rowId: id,
      data: { completed: !completed },
    });
    return updatedItem;
  } catch (error) {
    throw error;
  }
};

// UPDATE: rename the item
export const updateItem = async (id, item) => {
  try {
    const updatedItem = await tablesDB.updateRow({
      databaseId: config.db,
      tableId: config.table.todos,
      rowId: id,
      data: { item },
    });
    return updatedItem;
  } catch (error) {
    throw error;
  }
};

// DELETE
export const removeItem = async (id) => {
  try {
    await tablesDB.deleteRow({
      databaseId: config.db,
      tableId: config.table.todos,
      rowId: id,
    });
  } catch (error) {
    throw error;
  }
};