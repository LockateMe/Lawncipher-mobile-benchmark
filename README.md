# Lawncipher benchmark

## Aim

This application runs various workloads against [Lawncipher](https://github.com/LockateMe/Lawncipher.git) and [PouchDB](https://pouchdb.com) to :
* Compare their performance in the context of a hybrid Cordova app
* See what Lawncipher does well and what it doesn't
* See how much overhead is added by the cryptography in Lawncipher

This projects was developed as part of a semester project in a "Business Analytics & Intelligence" course given by Prof. Periklis Andritsos at HEC Lausanne.

## Design principle

This app was developed to see how Lawncipher would perform against other mobile document stores. Therefore, it is designed to test Lawncipher's features and capabilities. If a feature or a capability is not directly available in a "competing" document store, that feature is "added" in this app to allow the comparison.

__Example of design choice, applying this principle:__
Lawncipher allows to store JSON, string or Uint8Array/binary blobs. It doesn't care which of these types of data you provide. It will store that data and remember of what type it was, such that when you retrieve the said data, it will recover it's initial type.

In PouchDB, before you store an attachment, you have to encapsulate it in a [`Blob`](https://developer.mozilla.org/en/docs/Web/API/Blob) instance. When you retrieve the attachment from the document store, you have to reconvert/decapsulate the attachment yourself. In fairness, PouchDB allows you to indicate what type of data it is by providing a MIME string; but still, you have to do the conversion yourself.

I'm writing wrappers for every document store used in this app (to have a uniform interface to run the workloads on). In this current example, it's the object that wraps PouchDB that runs these data/format conversions, so that the wrapper can provide the same functionality/flexibility on every document store. And the time used by these conversions will be counted in the time taken to run the workload on the document store. I'll try to have an additional, separate time counter for these conversion operations, but I can't be sure yet that it will be precise enough.

## Prerequisites

* Node.js
	* Cordova
	* Bower
	* Grunt
* Make
* iOS and/or Android SDKs

## Types of workloads

The workloads are a mix of [YCSB](https://github.com/brianfrankcooper/YCSB)-based workloads and Lawncipher-targeted workloads:

* Mostly-read : 95% reads and 5% updates
* Mostly queries : 95% compound queries and 5% updates
* Read/write combination : 50% reads and 50% updates
* Mixed : 65% reads, 10% inserts and 25% updates
* Mostly-insert : 95% inserts and 5% reads
* Collection size stress test : 100000+ index documents in a single collection. See how it performs with advanced/compounds search queries
* Massive blob insertion and read: 10000+ blobs of 100kb-200kb each (ie, an Instagram picture), 250 reads. See how it performs with advanced queries with blobs of that size

## Building

Assuming that you have installed the prerequisites:

1. Clone this repository
2. Open the terminal and move to the cloned repo's directory
3. Run `make android` or `make ios` to build for Android or iOS respectively
4. To run the app on a physical device, run `make run-android` or `make run-ios`
