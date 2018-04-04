#!/usr/bin/env python

# Guillermo Carrera Trasobares 2017

import os
import sys
import argparse
import json
import re
from bs4 import BeautifulSoup
from mixpanel import Mixpanel

DEFAULT_FILE = "totalImports.json"
DEFAULT_JSON_FILE = "imports.json"
DEFAULT_SORT_FILE = "sortedImports.txt"

MIXPANEL_TOKEN = "ec0790cae6fb383f1cf7cab42a72c803"
MIXPANEL = Mixpanel(MIXPANEL_TOKEN)

parser = argparse.ArgumentParser()
parser.add_argument(
    '-u', '--url', help="Introduce the path  you want to start parsing")
parser.add_argument(
    '-f', '--file', help="Introduce the file with all paths you want to start parsing", type=argparse.FileType('r'))
parser.add_argument(
    '-o', '--output', help="Introduce the desired output: txt, json.....", default="json")
parser.add_argument(
    '-s', '--sorted', help="Sorts the output", action='store_true')
parser.add_argument('-l', '--listFiles',
                    help="Lists all files inside the selected directory and sub-directories",
                    action='store_true')
parser.add_argument('-m','--nomixpanel',help="Avoid send data to mixpanel", action="store_true")                    

args = parser.parse_args()

def sendToMixpanel(report):
  event = '%s (%s)' %(report['file_name'], report['version'])
  MIXPANEL.track(report['file_name'], event, report)
def removeDups(inputfile, outputfile):
    lines = open(inputfile, 'r').readlines()
    lines_set = set(lines)
    out = open(outputfile, 'w')
    for line in lines_set:
        out.write(line)


def listAllFiles(dirrel):
    count = 1
    for subdir, _, files in os.walk(dirrel):
        for _file in files:
            print str(count) + ': ' + os.path.join(subdir, _file)
            count = count + 1


def createJson(inputfile):
    fd = open(inputfile, 'r')
    lines = fd.readlines()
    fd.close()
    lines_without_repeted = list(set(lines))
    lines_without_repeted = [line.replace(
        '\n', '') for line in lines_without_repeted]
    with open(DEFAULT_JSON_FILE, 'w') as outputfile:
        json.dump(sorted(lines_without_repeted), outputfile, indent=2)
    return lines_without_repeted, lines


def funcionRecursiva(dirrel):
    fileopen = open(dirrel)
    soup2 = BeautifulSoup(fileopen, "html.parser")
    base_dir = os.path.dirname(dirrel)
    with open(DEFAULT_FILE, "a") as myfile:
        for link in soup2.find_all(rel="import"):
            #print('Import number:' + dirajust)
            if link.get('href') == '':
                break
            else:
                auxi = str(link.get('href'))
                url = os.path.abspath(base_dir + '/' + auxi)
                myfile.write(url + '\n')
                funcionRecursiva(url)

def generateReport(file_url):
    f = open(DEFAULT_FILE, 'w')
    f.close()
    funcionRecursiva(file_url)
    if args.output and args.sorted:
        if args.output == "json":
            removeDups(DEFAULT_FILE, DEFAULT_SORT_FILE)
            total_lines, lines = createJson(DEFAULT_SORT_FILE)
            match_regex = re.search(r'\/[^-]*-[^-]*-([^\/]*)\/', file_url)
            version = match_regex.group(1)
            print "%s - %d imports (totales %d)" % (file_url, len(total_lines), len(lines))

            return {"total_lines":len(lines),
                    "file_name":os.path.basename(file_url), "single_imports":len(total_lines),
                    "version":version}
        else:
            print "generating default .txt output"
            removeDups(DEFAULT_FILE, DEFAULT_SORT_FILE)
    else:
        if args.output:
            if args.output == "json":
                total_lines, lines = createJson(DEFAULT_FILE)
                match_regex = re.search(r'\/[^-]*-[^-]*-([^\/]*)\/', file_url)
                version = match_regex.group(1)
                print "%s - %d imports (totales %d)" % (file_url, len(total_lines), len(lines))
                
                return {"total_lines":len(lines),
                        "file_name":os.path.basename(file_url), "single_imports":len(total_lines),
                        "version":version}
    if args.sorted:
        removeDups(DEFAULT_FILE, DEFAULT_SORT_FILE)


if args.listFiles:
    if args.url:
        listAllFiles(args.url)
        sys.exit()
    else:
        print "No directory selected, using current one\n\n"
        listAllFiles(os.getcwd())
        sys.exit()


if args.url:
    f = open(DEFAULT_FILE, 'w')
    f.close()
    report = generateReport(args.url)
    output_file = open(DEFAULT_JSON_FILE, 'w')
    json.dump(report, output_file, indent=2)
    #sendToMixpanel(report)

elif args.file:
    components = args.file.readlines()
    report_list = [generateReport(file_url.replace('\n', '')) for file_url in components]
    output_file = open(DEFAULT_JSON_FILE, 'w')
    json.dump(report_list, output_file, indent=2)

    ## SEND TO MIXPANEL
    if not args.nomixpanel:
      print "Sending data to mixpanel"
      [sendToMixpanel(report) for report in report_list]
