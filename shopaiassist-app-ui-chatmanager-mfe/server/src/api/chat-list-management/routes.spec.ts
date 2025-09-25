import express from 'express';
import bodyParser from 'body-parser';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MongoConnection from '../../db';
import { FoldersSchema } from '../../db/schemas/folders-schema';
import {
  MockSecurityMiddleware,
  requestHeaders,
  testChatsData,
  testFoldersData,
  chatsAndFoldersByDate,
  chatsAndFoldersByName,
  chatsAndFoldersByType,
  archivedChatsAndFoldersByType,
  archivedSubChatsAndFoldersByType
} from '../../lib/utils/test-utils';
import { ChatsSchema } from '../../db/schemas/chats-schema';
import { SecurityMiddleware } from 'react';

import { ChatManagementRoutes } from './routes';

chai.use(chaiHttp);
const expect = chai.expect;

describe('ChatManagementRoutes', async () => {
  let app: express.Express;

  let mongoDbTestInstance: MongoConnection;
  let server: MongoMemoryServer;
  const mockSecurity = new MockSecurityMiddleware();

  before(async () => {
    // start server first
    server = await MongoMemoryServer.create();
    server.start();

    // then connect using the MongoConnection class
    const dbUri = await server.getUri();
    mongoDbTestInstance = new MongoConnection(dbUri);

    // For these tests, there needs to be some test data in the DB, so we set that here.
    await mongoDbTestInstance
      .getDbCollection(FoldersSchema.COLLECTION_NAME, FoldersSchema.SCHEMA)
      .collection.insertMany(testFoldersData);
    await mongoDbTestInstance
      .getDbCollection(ChatsSchema.COLLECTION_NAME, ChatsSchema.SCHEMA)
      .collection.insertMany(testChatsData);
  });

  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.use(ChatManagementRoutes.routes(mongoDbTestInstance, mockSecurity as SecurityMiddleware));
  });

  after(async () => {
    await server.stop();
    // have to close connection after server is stopped
    await mongoDbTestInstance.disconnectFromDb();
  });

  describe(`GET ${ChatManagementRoutes.PATHS.LIST}`, () => {
    it('should get chat and folders list from db sorted by_date (default)', () => {
      return chai
        .request(app)
        .get(ChatManagementRoutes.PATHS.LIST)
        .set(requestHeaders[0], requestHeaders[1])
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body.length).to.equal(4);
          expect(res.body).to.deep.equals(chatsAndFoldersByDate);
        });
    });

    it('should get chat and folders list from db sorted by_name ', () => {
      return chai
        .request(app)
        .get(ChatManagementRoutes.PATHS.LIST)
        .set(requestHeaders[0], requestHeaders[1])
        .query({ sortType: 'by_name' })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body.length).to.equal(4);
          expect(res.body).to.deep.equals(chatsAndFoldersByName);
        });
    });

    it('should get top level chat and folder list from db sorted by_type ', () => {
      return chai
        .request(app)
        .get(ChatManagementRoutes.PATHS.LIST)
        .set(requestHeaders[0], requestHeaders[1])
        .query({ sortType: 'by_type' })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body.length).to.equal(4);
          expect(res.body).to.deep.equals(chatsAndFoldersByType);
        });
    });

    it('should get top level archived chat and folder list from db sorted by_type ', () => {
      return chai
        .request(app)
        .get(ChatManagementRoutes.PATHS.LIST)
        .set(requestHeaders[0], requestHeaders[1])
        .query({ sortType: 'by_type', onlyArchivedMatters: true })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body.length).to.equal(1);
          expect(res.body).to.deep.equals(archivedChatsAndFoldersByType);
        });
    });

    it('should get sub level archived chat and folder list from db sorted by_type ', () => {
      return chai
        .request(app)
        .get(ChatManagementRoutes.PATHS.LIST)
        .set(requestHeaders[0], requestHeaders[1])
        .query({ sortType: 'by_type', onlyArchivedMatters: true, parentId: 'b5014a24-8f61-42eb-a24e-8f0b88fd18ab' })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body.length).to.equal(1);
          expect(res.body).to.deep.equals(archivedSubChatsAndFoldersByType);
        });
    });

    it('should fail if no auth header is set (top level)', () => {
      return chai
        .request(app)
        .get(ChatManagementRoutes.PATHS.LIST)
        .query({ sortType: 'by_type' })
        .then((res) => {
          expect(res).to.have.status(401);
          expect(res.body.code).to.equal('no_authorized_user');
        });
    });
  });
});
