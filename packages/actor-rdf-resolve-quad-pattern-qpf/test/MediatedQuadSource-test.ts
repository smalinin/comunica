import * as RDF from "rdf-js";
import {Readable} from "stream";
import {MediatedQuadSource} from "../lib/MediatedQuadSource";
const streamifyArray = require('streamify-array');
import {blankNode, namedNode, quad, variable} from "rdf-data-model";

describe('MediatedQuadSource', () => {
  let mediator;
  let filterCalled;
  let withFilter: (quad) => boolean;
  let uriConstructor;
  let S;
  let P;
  let O;
  let G;
  let V1;
  let V2;
  let V3;
  let V4;
  let BV1;

  beforeEach(() => {
    mediator = {};
    withFilter = null;
    mediator.mediate = (action) => new Promise((resolve, reject) => {
      const readable = stream([ action.url + '/a', action.url + '/b', action.url + '/c' ]);
      filterCalled = jest.spyOn(<any> readable, 'filter');
      resolve({
        data: readable,
        firstPageMetadata: 'somemetadata',
      });
    });
    uriConstructor = (s, p, o, g) => Promise.resolve(s.value + ',' + p.value + ',' + o.value + ',' + g.value);
    S = namedNode('S');
    P = namedNode('P');
    O = namedNode('O');
    G = namedNode('G');
    V1 = variable('v1');
    V2 = variable('v2');
    V3 = variable('v3');
    V4 = variable('v4');
    BV1 = blankNode('v1');
  });

  describe('The MediatedQuadSource module', () => {
    it('should be a function', () => {
      expect(MediatedQuadSource).toBeInstanceOf(Function);
    });

    it('should be a MediatedQuadSource constructor', () => {
      expect(new MediatedQuadSource(mediator, uriConstructor)).toBeInstanceOf(MediatedQuadSource);
    });
  });

  describe('A MediatedQuadSource instance', () => {
    let source: MediatedQuadSource;

    beforeEach(() => {
      source = new MediatedQuadSource(mediator, uriConstructor);
    });

    describe('for #getDuplicateElementLinks', () => {
      it('should return falsy on a blank pattern', () => {
        return expect(source.getDuplicateElementLinks()).toBeFalsy();
      });

      it('should return falsy on patterns with a single subject element', () => {
        return expect(source.getDuplicateElementLinks(S)).toBeFalsy();
      });

      it('should return falsy on patterns with a single predicate element', () => {
        return expect(source.getDuplicateElementLinks(null, P)).toBeFalsy();
      });

      it('should return falsy on patterns with a single object element', () => {
        return expect(source.getDuplicateElementLinks(null, null, O)).toBeFalsy();
      });

      it('should return falsy on patterns with a single graph element', () => {
        return expect(source.getDuplicateElementLinks(null, null, null, G)).toBeFalsy();
      });

      it('should return falsy on patterns with different elements', () => {
        return expect(source.getDuplicateElementLinks(S, P, O, G)).toBeFalsy();
      });

      it('should return falsy on patterns with different variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V2, V3, V4)).toBeFalsy();
      });

      it('should return falsy on patterns when blank nodes and variables have the same value', () => {
        return expect(source.getDuplicateElementLinks(V1, BV1, V3, V4)).toBeFalsy();
      });

      it('should return correctly on patterns with equal subject and predicate variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V1, V3, V4)).toEqual({ subject: [ 'predicate' ] });
      });

      it('should return correctly on patterns with equal subject and predicate blank nodes', () => {
        return expect(source.getDuplicateElementLinks(BV1, BV1, V3, V4)).toEqual({ subject: [ 'predicate' ] });
      });

      it('should return correctly on patterns with equal subject and object variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V2, V1, V4)).toEqual({ subject: [ 'object' ] });
      });

      it('should return correctly on patterns with equal subject and graph variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V2, V3, V1)).toEqual({ subject: [ 'graph' ] });
      });

      it('should return correctly on patterns with equal subject, predicate and object variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V1, V1, V4)).toEqual({ subject: [ 'predicate', 'object' ] });
      });

      it('should return correctly on patterns with equal subject, predicate and graph variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V1, V3, V1)).toEqual({ subject: [ 'predicate', 'graph' ] });
      });

      it('should return correctly on patterns with equal subject, object and graph variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V2, V1, V1)).toEqual({ subject: [ 'object', 'graph' ] });
      });

      it('should return correctly on patterns with equal subject, predicate, object and graph variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V1, V1, V1))
          .toEqual({ subject: [ 'predicate', 'object', 'graph' ] });
      });

      it('should return correctly on patterns with equal predicate and object variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V2, V2, V4)).toEqual({ predicate: [ 'object' ] });
      });

      it('should return correctly on patterns with equal predicate and graph variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V2, V3, V2)).toEqual({ predicate: [ 'graph' ] });
      });

      it('should return correctly on patterns with equal predicate, object and graph variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V2, V2, V2)).toEqual({ predicate: [ 'object', 'graph' ] });
      });

      it('should return correctly on patterns with equal object and graph variables', () => {
        return expect(source.getDuplicateElementLinks(V1, V2, V3, V3)).toEqual({ object: [ 'graph' ] });
      });
    });

    it('should throw an error on a subject regex call', () => {
      return expect(() => source.match(/.*/)).toThrow();
    });

    it('should throw an error on a predicate regex call', () => {
      return expect(() => source.match(null, /.*/)).toThrow();
    });

    it('should throw an error on a object regex call', () => {
      return expect(() => source.match(null, null, /.*/)).toThrow();
    });

    it('should throw an error on a graph regex call', () => {
      return expect(() => source.match(null, null, null, /.*/)).toThrow();
    });

    it('should return the mediated stream', () => {
      return new Promise((resolve, reject) => {
        const output: RDF.Stream = source.match(S, P, O, G);
        const list = [];
        output.on('data', (e) => list.push(e));
        output.on('error', reject);
        output.on('end', () => {
          if (list.length !== 3) {
            reject();
          } else {
            expect(list).toEqual([ 'S,P,O,G/a', 'S,P,O,G/b', 'S,P,O,G/c' ]);
            expect(filterCalled).not.toHaveBeenCalled();
            resolve();
          }
        });
      });
    });

    it('should not filter the mediated stream for non-duplicate variables', () => {
      return new Promise((resolve, reject) => {
        const output: RDF.Stream = source.match(V1, V2, V3, V4);
        const list = [];
        output.on('data', (e) => list.push(e));
        output.on('error', reject);
        output.on('end', () => {
          expect(filterCalled).not.toHaveBeenCalled();
          expect(withFilter).toBeFalsy();
          resolve();
        });
      });
    });

    it('should filter the mediated stream for duplicate subject and predicate variables', () => {
      return new Promise((resolve, reject) => {
        const output: RDF.Stream = source.match(V1, V1, O, G);
        const list = [];
        output.on('data', (e) => list.push(e));
        output.on('error', reject);
        output.on('end', () => {
          expect(filterCalled).toHaveBeenCalledTimes(1);
          expect(withFilter).toBeTruthy();

          expect(withFilter(quad(S, P, O, G))).toBe(false);
          expect(withFilter(quad(S, S, O, G))).toBe(true);
          expect(withFilter(quad(P, P, O, G))).toBe(true);
          expect(withFilter(quad(S, S, S, S))).toBe(true);

          resolve();
        });
      });
    });

    it('should filter the mediated stream for duplicate predicate, object and graph variables', () => {
      return new Promise((resolve, reject) => {
        const output: RDF.Stream = source.match(S, V2, V2, V2);
        const list = [];
        output.on('data', (e) => list.push(e));
        output.on('error', reject);
        output.on('end', () => {
          expect(filterCalled).toHaveBeenCalledTimes(1);
          expect(withFilter).toBeTruthy();

          expect(withFilter(quad(S, P, O, G))).toBe(false);
          expect(withFilter(quad(S, S, O, G))).toBe(false);
          expect(withFilter(quad(P, P, O, G))).toBe(false);

          expect(withFilter(quad(S, P, P, P))).toBe(true);
          expect(withFilter(quad(S, P, P, G))).toBe(false);
          expect(withFilter(quad(S, P, O, P))).toBe(false);
          expect(withFilter(quad(S, P, O, G))).toBe(false);
          expect(withFilter(quad(S, G, P, P))).toBe(false);
          expect(withFilter(quad(S, G, P, G))).toBe(false);
          expect(withFilter(quad(S, G, O, P))).toBe(false);
          expect(withFilter(quad(S, G, O, G))).toBe(false);

          expect(withFilter(quad(S, S, S, S))).toBe(true);
          expect(withFilter(quad(S, P, P, P))).toBe(true);
          expect(withFilter(quad(S, O, O, O))).toBe(true);
          expect(withFilter(quad(S, G, G, G))).toBe(true);

          resolve();
        });
      });
    });

    it('should return the mediated metadata', () => {
      return new Promise((resolve, reject) => {
        const output: RDF.Stream = source.match(S, P, O, G);
        output.on('metadata', (metadata) => {
          expect(metadata).toEqual('somemetadata');
          resolve();
        });
        output.on('error', reject);
        output.on('end', reject);
      });
    });

    it('should delegate promise rejections', () => {
      const error = new Error('a');
      mediator.mediate = (action) => new Promise((resolve, reject) => {
        setImmediate(() => reject(error));
      });
      return new Promise((resolve, reject) => {
        const output: RDF.Stream = source.match(S, P, O, G);
        output.on('data', () => ({}));
        output.on('error', (e) => {
          expect(e).toEqual(error);
          resolve();
        });
        output.on('end', reject);
      });
    });

    it('should delegate errors', () => {
      const data = stream([ 'a', 'b' ]);
      mediator.mediate = (action) => Promise.resolve({ data });
      const error = new Error('a');
      return new Promise((resolve, reject) => {
        const output: RDF.Stream = source.match(S, P, O, G);
        output.on('data', () => {
          data.emit('error', error);
          return;
        });
        output.on('error', (e) => {
          expect(e).toEqual(error);
          resolve();
        });
        output.on('end', reject);
      });
    });
  });

  function stream(elements) {
    const readable = streamifyArray(elements);
    (<any> readable).filter = (filter: (quad) => boolean) => {
      withFilter = filter;
      return readable;
    };
    return readable;
  }
});
