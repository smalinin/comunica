# Comunica RDF Dereference

[![npm version](https://badge.fury.io/js/%40comunica%2Factor-init-rdf-dereference.svg)](https://www.npmjs.com/package/@comunica/actor-init-rdf-dereference)

An example init actor for Comunica that triggers an RDF Dereference event for the given URL.

This module is part of the [Comunica framework](https://github.com/comunica/comunica).

## Install

```bash
$ yarn add @comunica/actor-init-rdf-dereference
```

## Usage

The `config/config-example.json` contains an example on how to run this actor,
which will trigger on the Runner's 'init' event.

As defined by `components/ActorInitRdfDereference`,
the actor allows optional URL parameters to be changed.

When executed, the actor will take the URL from the first CLI parameter,
or take it from the config file if not available,
perform the request, and print its response to stdout.

When `@comunica/runner-cli`, `@comunica/runner`
and any HTTP actor (such as `@comunica/actor-http-node-fetch`),
and any RDF parse actor (such as `@comunica/actor-rdf-parse-n3`) are installed,
executing the following:

```
$ node_modules/.bin/comunica-run config/config-example.json
```

will print the response.

**Note: when running in a dev environment:**
Make sure that your `NODE_PATH` contains the `node_modules` folder of this module.
