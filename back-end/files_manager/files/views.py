# -*- coding: utf-8 -*-
from django.http import HttpResponse
from files.models import Component, ComponentAttributes
import codecs

def index(request):
    # atrList = []
    # nameComp =[]
    # for comp in Component.objects:
    #     atrList.append(comp.attributes)
    #     nameComp.append(comp.component_id)
    #     CompAtrDict= dict(zip(nameComp,atrList))
    f = codecs.open("/home/miguel/proyecto/sandbox/app/index.html",'r')
    # import ipdb; ipdb.sset_trace()

# Aqui en la respuesta tendria que ejecutarse esto al pulsa un boton y que me devuelva la lista 
# con los atributos
    return HttpResponse(f.read())

# MM - We could show more views eg: index, prueba 1 etc.. 
# def prueba1(request, pregunta_id):