# -*- coding: utf-8 -*-
from mongoengine import Document, StringField, ListField, IntField, BooleanField


class User(Document):
    email = StringField(required=True)
    first_name = StringField(max_length=50)
    last_name = StringField(max_length=50)


class Component(Document):
    component_id = StringField()
    url = StringField()
    input_type = ListField(StringField())
    output_type = ListField(StringField())
    rs = StringField()
    description = StringField()
    # List of versions available for a component
    version_list = ListField(StringField())
    # Index to control the version that will be served to the next user that adds it to his dashboard
    version_index = IntField()
    # Determines the times that the general component has been tested
    test_count = IntField(default=0)
    # Represents if the component will served in a predetermined way to every new user in the system
    predetermined = BooleanField(default=False)
    # Preasigned version to load the component. It needs to be confirmed
    version = StringField()
    attributes = StringField()
    img = StringField()
    tokenAttr = StringField()

class ComponentAttributes(Document):
    component_id =StringField(required=True)
    access_token =StringField()
    secret_token =StringField()
    consumer_key =StringField()
    consumer_secret =StringField()
    endpoint =StringField()
    component_base =StringField()
    language =StringField(default=":language")
    count =IntField()
    username =StringField()
    token =StringField()
    mostrar =IntField()
    component_directory =StringField()
    accessToken =StringField()
    api_key = StringField()