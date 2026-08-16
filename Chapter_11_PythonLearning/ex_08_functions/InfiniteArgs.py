def print_mul_arg(*pramod_list):
    # args - tuple of arguments
    for i in pramod_list:
        print(i)


print_mul_arg("pramod")
print_mul_arg(2, 3, 1, 4, 3, 2, 2, 2, 2, 2, 2)
print_mul_arg("pramod", "dutta")
print_mul_arg("pramod", "dutta", "third")
print_mul_arg("pramod", "dutta", "third", 3.14)
print_mul_arg("pramod", "dutta", "third", 3.14, True)

""" The * before pramod_list makes this a variable-length argument (commonly called *args, though here it's named pramod_list). 
It lets the function accept any number of positional arguments — zero, one, or many — and collects them all into a single tuple 
inside the function.
"""