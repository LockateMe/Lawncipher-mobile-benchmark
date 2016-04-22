# Lawncipher benchmark

## Aim

This application runs various workloads against [Lawncipher](https://github.com/LockateMe/Lawncipher.git) and other mobile databases ([PouchDB](https://pouchdb.com) and [Couchbase Lite](http://www.couchbase.com/nosql-databases/couchbase-mobile)) to
* Compare their performance in the context of a hybrid Cordova app
* See what Lawncipher does well and what it doesn't
* See how much overhead is added by the cryptography in Lawncipher

This projects was developed as part of a semester project in a "Business Analytics & Intelligence" course given by Prof. Periklis Andritsos at HEC Lausanne.

## Prerequisites

* Node.js
* Cordova
* Make
* Bower
* Grunt
* iOS and/or Android SDKs

## Types of workloads

The workloads are a mix of [YCSB](https://github.com/brianfrankcooper/YCSB)-based workloads and Lawncipher-targeted workloads:

* Mostly-read : 95% reads and 5% updates
* Read/write combination : 50% reads and 50% updates
* Read-modify-write : 50% reads and 50% read-modify-write
* Mixed : 65% reads, 10% inserts and 25% updates
* Mostly-insert : 95% inserts and 5% reads
* Collection size stress test : 100000+ index documents in a single collection. See how it performs with advanced/compounds search queries
* Massive blob insertion and read: 10000+ blobs of 100kb-200kb each (ie, an Instagram picture), 250 reads. See how it performs with advanced queries with blobs of that size
