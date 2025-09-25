import { LOG } from 'react';
import mongoose, { Model, Schema } from 'mongoose';

/**
 * Manages database connectivity and interactions with a MongoDB instance.
 * This class provides methods to establish a connection to MongoDB, retrieve models for specific collections,
 * and handle disconnection.
 */
export default class MongoConnection {
  private dbConnection?: mongoose.Connection;

  /**
   * Initializes a new instance of the MongoConnection class and connects to MongoDB using the provided URL.
   * @param {string | undefined} mongoUrl - The URL to connect to MongoDB. Must be provided to establish a connection.
   * @throws {Error} If the mongoUrl is not provided or if the database connection is already established.
   */
  constructor(mongoUrl?: string) {
    if (this.dbConnection) {
      LOG.info('Mongo already connected, using existing connection');
    } else if (mongoUrl) {
      this.dbConnection = mongoose.createConnection(mongoUrl);
      LOG.info('Connected to MongoDB: Themis');
    } else {
      throw new Error('Mongo URL not set');
    }
  }

  /**
   * Retrieves a MongoDB model for a specified collection and schema.
   * @param {string} collectionName - The name of the collection.
   * @param {Schema<T>} schema - The mongoose schema associated with the collection.
   * @returns {Model<T>} The model for the specified collection.
   * @throws {Error} If the database connection is not established.
   */
  public getDbCollection<T>(collectionName: string, schema: Schema<T>): Model<T> {
    if (this.dbConnection) {
      return this.dbConnection.model(collectionName, schema) as Model<T>;
    } else {
      throw new Error('DB not connected');
    }
  }

  /**
   * Closes the database connection.
   * @returns {Promise<void>} A promise that resolves when the connection is successfully closed.
   */
  public async disconnectFromDb() {
    if (this.dbConnection) {
      await this.dbConnection.close(true);
      LOG.info('Disconnected from MongoDB');
    }
  }
}
