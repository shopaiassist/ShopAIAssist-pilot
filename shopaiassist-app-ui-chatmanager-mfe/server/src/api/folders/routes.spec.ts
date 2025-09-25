import express from 'express';
import bodyParser from 'body-parser';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MongoConnection from '../../db';
import { FoldersSchema } from '../../db/schemas/folders-schema';
import { FolderItem } from '../../lib/shared/chat-management-types';
import { MockSecurityMiddleware, requestHeaders, testFoldersData } from '../../lib/utils/test-utils';
import { SecurityMiddleware } from 'react';
import fetchMock from 'fetch-mock';
import MercuryIntegration from '../../lib/files/service';

import { FoldersRoutes } from './routes';

chai.use(chaiHttp);
const expect = chai.expect;

describe('FoldersRoutes', async () => {
  let app: express.Express;

  let mongoDbTestInstance: MongoConnection;
  let server: MongoMemoryServer;
  const mockSecurity = new MockSecurityMiddleware();

  const mercuryUrl = MercuryIntegration.getMercuryUrl('us');
  const fetchPostMock = (url: string, status: number, body: object) =>
    fetchMock.post(url, { status, body: JSON.stringify(body) });
  const fetchDeleteMock = (url: string, status: number, body: object) =>
    fetchMock.delete(url, { status, body: JSON.stringify(body) });

  before(async () => {
    // start server first
    server = await MongoMemoryServer.create();
    server.start();

    // then connect using the MongoConnection class
    const dbUri = await server.getUri();
    mongoDbTestInstance = new MongoConnection(dbUri);
    await mongoDbTestInstance
      .getDbCollection(FoldersSchema.COLLECTION_NAME, FoldersSchema.SCHEMA)
      .collection.insertMany(testFoldersData);
  });

  beforeEach(async () => {
    fetchMock.reset();
    app = express();
    app.use(bodyParser.json());
    app.use(FoldersRoutes.routes(mongoDbTestInstance, mockSecurity as SecurityMiddleware));
  });

  after(async () => {
    await mongoDbTestInstance.getDbCollection(FoldersSchema.COLLECTION_NAME, FoldersSchema.SCHEMA).collection.drop();
    await server.stop();
    // have to close connection after server is stopped
    await mongoDbTestInstance.disconnectFromDb();
  });

  describe(`POST ${FoldersRoutes.PATHS.FOLDERS}`, () => {
    it('should insert new folder into db', () => {
      fetchPostMock(`begin:${mercuryUrl}`, 201, { whatever: 'asdad' });

      return chai
        .request(app)
        .post(FoldersRoutes.PATHS.FOLDERS)
        .set(requestHeaders[0], requestHeaders[1])
        .send({ name: 'Test folder', description: 'Folder For Testing', matterId: 'Folder 1' })
        .then((res) => {
          expect(res.body.newFolder).to.haveOwnProperty('treeItemId');
          expect(res).to.have.status(201);
        });
    });

    it('should fail to insert new folder into db (Missing name)', () => {
      return chai
        .request(app)
        .post(FoldersRoutes.PATHS.FOLDERS)
        .set(requestHeaders[0], requestHeaders[1])
        .then((res) => {
          expect(res).to.have.status(400);
          expect(res.body.code).to.equal('missing_property');
        });
    });
  });

  describe(`PATCH ${FoldersRoutes.PATHS.FOLDERS}`, async () => {
    let folderId: string;
    before(async () => {
      folderId = (
        (await mongoDbTestInstance
          .getDbCollection(FoldersSchema.COLLECTION_NAME, FoldersSchema.SCHEMA)
          .find()) as FolderItem[]
      )[0].treeItemId;
    });

    it('should update new folder into db', async () => {
      return chai
        .request(app)
        .patch(FoldersRoutes.PATHS.FOLDERS)
        .set(requestHeaders[0], requestHeaders[1])
        .send({ id: folderId, updates: { name: 'New Folder Name' } })
        .then((res) => {
          expect(res).to.have.status(200);
        });
    });

    it('should fail to update folder in db (Missing treeItemId)', () => {
      return chai
        .request(app)
        .patch(FoldersRoutes.PATHS.FOLDERS)
        .set(requestHeaders[0], requestHeaders[1])
        .then((res) => {
          expect(res).to.have.status(400);
          expect(res.body.code).to.equal('missing_property');
        });
    });

    it('should fail to update folder in db (No updates)', () => {
      return chai
        .request(app)
        .patch(FoldersRoutes.PATHS.FOLDERS)
        .set(requestHeaders[0], requestHeaders[1])
        .send({ id: folderId })
        .then((res) => {
          expect(res).to.have.status(400);
          expect(res.body.code).to.equal('missing_property');
        });
    });

    it('should fail to update folder in db (folder not found)', () => {
      return chai
        .request(app)
        .patch(FoldersRoutes.PATHS.FOLDERS)
        .set(requestHeaders[0], requestHeaders[1])
        .send({ id: 'test-folder-uuid-number2', updates: { name: 'New folder Name' } })
        .then((res) => {
          expect(res).to.have.status(404);
          expect(res.body.code).to.equal('not_found');
        });
    });
  });

  describe(`DELETE ${FoldersRoutes.PATHS.FOLDERS}`, () => {
    let folderId: string;
    before(async () => {
      folderId = (
        (await mongoDbTestInstance
          .getDbCollection(FoldersSchema.COLLECTION_NAME, FoldersSchema.SCHEMA)
          .find()) as FolderItem[]
      )[0].treeItemId;
    });

    it('should fail to delete folder in db (Missing treeItemId)', () => {
      return chai
        .request(app)
        .delete(FoldersRoutes.PATHS.FOLDERS)
        .set(requestHeaders[0], requestHeaders[1])
        .then((res) => {
          expect(res).to.have.status(400);
          expect(res.body.code).to.equal('missing_property');
        });
    });

    it('should fail to delete folder in db (folder not found)', () => {
      return chai
        .request(app)
        .delete(FoldersRoutes.PATHS.FOLDERS)
        .set(requestHeaders[0], requestHeaders[1])
        .send({ id: 'test-folder-uuid-number2' })
        .then((res) => {
          expect(res).to.have.status(404);
          expect(res.body.code).to.equal('not_found');
        });
    });

    it('should delete folder from db', () => {
      fetchDeleteMock(`begin:${mercuryUrl}`, 200, { whatever: 'asdad' });
      return chai
        .request(app)
        .delete(FoldersRoutes.PATHS.FOLDERS)
        .set(requestHeaders[0], requestHeaders[1])
        .send({ id: folderId })
        .then((res) => {
          expect(res).to.have.status(204);
        });
    });
  });
});
